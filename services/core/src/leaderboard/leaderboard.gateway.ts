import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  Logger,
  UseGuards,
  Injectable,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { LeaderboardCacheService } from './cache/leaderboard.cache.service';
import { LeaderboardService } from './leaderboard.service';
import { InitLeaderboardDto } from './dto/leaderboard.dto';
// import { WsJwtAuthGuard } from '../auth/ws-jwt-auth.guard';
// import { AuthService } from '../auth/auth.service';
import { LeaderboardStatus } from '../common/enums/contest.enum';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class LeaderboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('LeaderboardGateway');

  constructor(
    @Inject(forwardRef(() => LeaderboardCacheService))
    private readonly leaderboardCacheService: LeaderboardCacheService,
    @Inject(forwardRef(() => LeaderboardService))
    private readonly leaderboardService: LeaderboardService,

    // @Inject(forwardRef(() => AuthService))
    // private readonly authService: AuthService,
  ) {}

  // @UseGuards(WsJwtAuthGuard)
  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_leaderboard_room')
  async handleJoinRoom(
    @MessageBody()
    payload: { contestId: string; role: 'owner' | 'participant' },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { contestId, role } = payload;
    if (!contestId || !['owner', 'participant'].includes(role)) {
      client.emit('leaderboard_error', {
        message: 'Invalid contestId or role',
      });
      return;
    }

    const roomName = `leaderboard_${contestId}_${role}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);

    try {
      const currentLeaderboard =
        await this.leaderboardService.getLeaderboardByContestId(contestId);
      if (currentLeaderboard) {
        client.emit('leaderboard_update', currentLeaderboard);
      } else {
        client.emit('leaderboard_update', { contestId, users: [] });
      }
    } catch (error) {
      client.emit('leaderboard_error', {
        message: 'Could not load initial leaderboard data.',
      });
    }
  }

  @SubscribeMessage('leave_leaderboard_room')
  handleLeaveRoom(
    @MessageBody() contestId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!contestId || typeof contestId !== 'string') return;
    const roomName = `leaderboard_${contestId}`;
    client.leave(roomName);
    this.logger.log(`Client ${client.id} left room: ${roomName}`);
  }

  async emitLeaderboardUpdate(
    contestId: string,
    leaderboardData: InitLeaderboardDto,
  ): Promise<void> {
    const roomOwner = `leaderboard_${contestId}_owner`;
    const roomParticipant = `leaderboard_${contestId}_participant`;

    this.server.to(roomOwner).emit('leaderboard_update', leaderboardData);

    const status =
      await this.leaderboardService.getContestLeaderboardStatus(contestId);
    if (status === LeaderboardStatus.OPEN) {
      this.server
        .to(roomParticipant)
        .emit('leaderboard_update', leaderboardData);
    } else {
      this.logger.log(
        `Leaderboard is ${status}, not emitting to participants (contest ${contestId})`,
      );
    }
  }

  emitLeaderboardStatusUpdate(
    contestId: string,
    newStatus: LeaderboardStatus,
  ): void {
    const roomParticipant = `leaderboard_${contestId}_participant`;
    const roomOwner = `leaderboard_${contestId}_owner`;

    const payload = {
      contestId,
      status: newStatus,
    };

    this.server.to(roomParticipant).emit('leaderboard_status_update', payload);
    this.server.to(roomOwner).emit('leaderboard_status_update', payload);

    this.logger.log(
      `Emitted leaderboard status update to both participant and owner rooms for contest ${contestId}`,
    );
  }
}
