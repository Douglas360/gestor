import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { OperatorsController } from './operators.controller.js';

@Module({
  imports: [DbModule],
  controllers: [OperatorsController]
})
export class OperatorsModule {}
