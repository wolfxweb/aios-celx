<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Ticket;
use App\Models\User;
use App\Services\SlaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoadmapMvpTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_store_sets_sla_deadlines(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AGENT]);
        $client = Client::factory()->create();

        $this->actingAs($user)->post(route('tickets.store'), [
            'client_id' => $client->id,
            'priority' => 'normal',
            'title' => 'Teste SLA',
            'description' => 'x',
        ])->assertRedirect();

        $ticket = Ticket::query()->first();
        $this->assertNotNull($ticket);
        $this->assertNotNull($ticket->sla_due_at);
        $this->assertNotNull($ticket->sla_response_due_at);
    }

    public function test_sla_service_apply_deadlines(): void
    {
        $ticket = Ticket::factory()->create(['priority' => 'high']);
        app(SlaService::class)->applyDeadlines($ticket);
        $ticket->save();

        $this->assertTrue($ticket->sla_response_due_at->lessThan($ticket->sla_due_at));
    }

    public function test_non_admin_cannot_access_users_area(): void
    {
        $agent = User::factory()->create(['role' => User::ROLE_AGENT]);

        $this->actingAs($agent)->get(route('users.index'))->assertForbidden();
    }

    public function test_admin_can_access_users_area(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $this->actingAs($admin)->get(route('users.index'))->assertOk();
    }
}
