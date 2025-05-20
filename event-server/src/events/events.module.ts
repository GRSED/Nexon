import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { Event, EventSchema } from './schemas/event.schema';
import { EventRepository } from './repositories/event.repository';
import { Reward, RewardSchema } from './schemas/reward.schema';
import { RewardRepository } from './repositories/reward.repository';
import { RewardRequest, RewardRequestSchema } from './schemas/reward.schema';
import { RewardRequestRepository } from './repositories/reward-request.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: RewardRequest.name, schema: RewardRequestSchema },
    ]),
  ],
  providers: [
    EventsService,
    EventRepository,
    RewardRepository,
    RewardRequestRepository,
  ],
  exports: [EventsService],
})
export class EventsModule {}
