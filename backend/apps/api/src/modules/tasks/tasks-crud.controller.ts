import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BossService } from '../boss/boss.service.js';
import { SupabaseService } from '../db/supabase.service.js';
import { AnyRequest, TenantAuthGuard } from '../auth/tenant-auth.guard.js';

@UseGuards(TenantAuthGuard)
@Controller('v1/tenants/:tenantId/tasks')
export class TasksCrudController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly boss: BossService
  ) {}

  @Post()
  async create(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Body() body: any) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);
    const payload: any = {
      tenant_id: tenantId,
      title: String(body?.title || ''),
      description: body?.description ?? null,
      status: body?.status ?? 'created',
      operator_id: body?.operator_id ?? null,
      priority: body?.priority ?? 'media',
      due_date: body?.due_date ?? null,
      tags: body?.tags ?? [],
      subtasks: body?.subtasks ?? [],
      reminder: body?.reminder ?? null
    };

    if (!payload.title) throw new Error('title is required');

    const { data, error } = await sb
      .from('tasks')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    await sb.from('task_events').insert({
      tenant_id: tenantId,
      task_id: data.id,
      kind: 'task.created',
      data: payload
    });

    // Auto-notify operator on WhatsApp when a responsible operator is set
    if (data.operator_id) {
      await this.boss.client.send('wa.outbound.send', {
        tenantId,
        taskId: data.id,
        operatorId: data.operator_id,
        reason: 'task.created.auto_notify'
      });

      await sb.from('task_events').insert({
        tenant_id: tenantId,
        task_id: data.id,
        kind: 'task.notify.enqueued',
        data: { operator_id: data.operator_id }
      });
    }

    return data;
  }

  @Get()
  async list(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('operator_id') operatorId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    let q = sb.from('tasks').select('*').eq('tenant_id', tenantId);
    if (status) q = q.eq('status', status);
    if (operatorId) q = q.eq('operator_id', operatorId);

    const lim = limit ? Number(limit) : 50;
    const off = offset ? Number(offset) : 0;

    const { data, error } = await q.order('created_at', { ascending: false }).range(off, off + lim - 1);
    if (error) throw new Error(error.message);
    return { data, limit: lim, offset: off };
  }

  @Get(':taskId')
  async get(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Param('taskId') taskId: string) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    const { data, error } = await sb
      .from('tasks')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', taskId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  @Get(':taskId/events')
  async events(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    const lim = limit ? Number(limit) : 50;
    const off = offset ? Number(offset) : 0;

    const { data, error } = await sb
      .from('task_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .range(off, off + lim - 1);

    if (error) throw new Error(error.message);
    return { data, limit: lim, offset: off };
  }

  @Patch(':taskId')
  async update(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
    @Body() body: any
  ) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    const patch: any = {};
    if (body?.title !== undefined) patch.title = String(body.title);
    if (body?.description !== undefined) patch.description = body.description;
    if (body?.status !== undefined) patch.status = String(body.status);
    if (body?.operator_id !== undefined) patch.operator_id = body.operator_id;
    if (body?.priority !== undefined) patch.priority = String(body.priority);
    if (body?.due_date !== undefined) patch.due_date = body.due_date;
    if (body?.tags !== undefined) patch.tags = body.tags;
    if (body?.subtasks !== undefined) patch.subtasks = body.subtasks;
    if (body?.reminder !== undefined) patch.reminder = body.reminder;

    const { data, error } = await sb
      .from('tasks')
      .update(patch)
      .eq('tenant_id', tenantId)
      .eq('id', taskId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    await sb.from('task_events').insert({
      tenant_id: tenantId,
      task_id: taskId,
      kind: 'task.updated',
      data: patch
    });

    return data;
  }

  @Delete(':taskId')
  async remove(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Param('taskId') taskId: string) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    const { error } = await sb
      .from('tasks')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', taskId);

    if (error) throw new Error(error.message);
    return { ok: true };
  }
}
