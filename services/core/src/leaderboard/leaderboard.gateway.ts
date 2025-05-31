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
    @MessageBody() contestId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!contestId || typeof contestId !== 'string') {
      this.logger.warn(
        `Client ${client.id} tried to join room with invalid contestId: ${contestId}`,
      );
      client.emit('leaderboard_error', {
        message: 'Invalid contest ID provided.',
      });
      return;
    }
    const roomName = `leaderboard_${contestId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);

    try {
      const currentLeaderboard =
        await this.leaderboardService.getLeaderboardByContestId(contestId);
      if (currentLeaderboard) {
        client.emit('leaderboard_update', currentLeaderboard);
        this.logger.log(
          `Sent initial leaderboard data to ${client.id} for room ${roomName}`,
        );
      } else {
        this.logger.log(
          `No initial leaderboard data found for room ${roomName}`,
        );
        client.emit('leaderboard_update', { contestId, users: [] });
      }
    } catch (error) {
      this.logger.error(
        `Failed to get initial leaderboard for ${roomName}`,
        error.stack,
      );
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

  emitLeaderboardUpdate(
    contestId: string,
    leaderboardData: InitLeaderboardDto,
  ): void {
    if (!contestId || !leaderboardData) {
      this.logger.warn(
        `Attempted to emit update with invalid data for contest ${contestId}`,
      );
      return;
    }
    const roomName = `leaderboard_${contestId}`;
    this.server.to(roomName).emit('leaderboard_update', leaderboardData);
    this.logger.log(`Emitted leaderboard update to room: ${roomName}`);
  }

  emitLeaderboardStatusUpdate(
    contestId: string,
    newStatus: LeaderboardStatus,
  ): void {
    const roomName = `leaderboard_${contestId}`;
    this.server.to(roomName).emit('leaderboard_status_update', {
      contestId: contestId,
      status: newStatus,
    });
    this.logger.log(
      `Emitted leaderboard status update to room: ${roomName} with contestId`,
    );
  }
}
