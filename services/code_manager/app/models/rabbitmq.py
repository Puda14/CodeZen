import os
import pika  # type: ignore
import json
import time
import logging

class RabbitMQClient:
  def __init__(self):
    self.url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
    self.connection = None
    self.channel = None
    self._connect_with_retry()

  def _connect_with_retry(self, retries=5, delay=5):
    """
    Connect to RabbitMQ with retry logic in case of failure.
    """
    for attempt in range(retries):
      try:
        parameters = pika.URLParameters(self.url)
        parameters.heartbeat = 3600
        parameters.blocked_connection_timeout = 20
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        logging.info("Successfully connected to RabbitMQ!")
        return
      except pika.exceptions.AMQPConnectionError as e:
        logging.error(f"Failed to connect to RabbitMQ (attempt {attempt + 1}/{retries}): {e}")
        time.sleep(delay)
    raise Exception("Failed to connect to RabbitMQ after multiple attempts")

  def declare_queue(self, queue_name):
    """
    Declare a queue if it doesn't exist.
    """
    self.channel.queue_declare(queue=queue_name, durable=True)
    logging.info(f"Queue '{queue_name}' declared.")

  def publish(self, queue_name, message):
    """
    Publish a message to the specified queue with reconnect logic.
    """
    try:
      if self.channel.is_closed:
        logging.warning("Channel is closed. Reinitializing...")
        self._connect_with_retry()

      self.channel.basic_publish(
        exchange='',
        routing_key=queue_name,
        body=json.dumps(message),
        properties=pika.BasicProperties(delivery_mode=2)
      )
      logging.info(f"Message published to queue '{queue_name}': {message}")
    except (pika.exceptions.ConnectionClosed, pika.exceptions.ChannelClosed) as e:
      logging.error(f"Connection closed: {e}. Retrying...")
      self._connect_with_retry()
      self.publish(queue_name, message)
    except Exception as e:
      logging.error(f"Unexpected error during publish: {e}")
      raise

  def consume(self, queue_name, callback):
    """
    Set up a consumer to process messages from a queue.
    """
    def wrapper(ch, method, properties, body):
      try:
        message = json.loads(body)
        callback(message)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        logging.info(f"Message processed from queue '{queue_name}': {message}")
      except Exception as e:
        logging.error(f"Error processing message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag)

    self.channel.basic_consume(queue=queue_name, on_message_callback=wrapper)
    logging.info(f"Consumer set up for queue '{queue_name}'.")

  def start_consuming(self):
    """
    Start consuming messages with reconnect logic.
    """
    while True:
      try:
        logging.info("Started consuming messages...")
        self.channel.start_consuming()
      except (pika.exceptions.ConnectionClosed, pika.exceptions.ChannelClosed) as e:
        logging.error(f"Connection or channel closed: {e}. Reconnecting...")
        self._connect_with_retry()
      except Exception as e:
        logging.error(f"Unexpected error during consuming: {e}")
        time.sleep(5)

  def get_message(self, queue_name):
    """
    Peek at a single message from the queue without removing it.
    """
    method_frame, properties, body = self.channel.basic_get(queue=queue_name, auto_ack=True)  # Auto-acknowledge
    if method_frame:
      return json.loads(body)
    return None

  def declare_ttl_queue(self, queue_name, ttl_ms):
    """
    Declare a queue with a TTL for messages.
    """
    self.channel.queue_declare(
      queue=queue_name,
      durable=True,
      arguments={"x-message-ttl": ttl_ms}  # TTL in milliseconds
    )

  def close(self):
    """
    Close the RabbitMQ connection.
    """
    if self.connection:
      self.connection.close()
      logging.info("RabbitMQ connection closed.")
