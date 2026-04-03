import { Module } from '@nestjs/common';
import { BossModule } from '../boss/boss.module.js';
import { DbModule } from '../db/db.module.js';
import { TasksController } from './tasks.controller.js';
import { TasksCrudController } from './tasks-crud.controller.js';

@Module({
  imports: [BossModule, DbModule],
  controllers: [TasksController, TasksCrudController]
})
export class TasksModule {}
