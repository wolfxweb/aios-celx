<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_redirected_from_dashboard_to_portal(): void
    {
        $client = Client::factory()->create();
        $user = User::factory()->create([
            'role' => User::ROLE_CLIENT,
            'client_id' => $client->id,
        ]);

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('portal.tickets.index'));
    }

    public function test_client_sees_only_own_tickets_on_portal(): void
    {
        $clientA = Client::factory()->create();
        $clientB = Client::factory()->create();
        $user = User::factory()->create([
            'role' => User::ROLE_CLIENT,
            'client_id' => $clientA->id,
        ]);

        $mine = Ticket::factory()->create(['client_id' => $clientA->id, 'title' => 'Meu ticket']);
        Ticket::factory()->create(['client_id' => $clientB->id, 'title' => 'Outro cliente']);

        $this->actingAs($user)->get(route('portal.tickets.index'))
            ->assertOk()
            ->assertSee('Meu ticket')
            ->assertDontSee('Outro cliente');
    }

    public function test_client_cannot_view_other_client_ticket(): void
    {
        $clientA = Client::factory()->create();
        $clientB = Client::factory()->create();
        $user = User::factory()->create([
            'role' => User::ROLE_CLIENT,
            'client_id' => $clientA->id,
        ]);
        $other = Ticket::factory()->create(['client_id' => $clientB->id]);

        $this->actingAs($user)->get(route('portal.tickets.show', $other))->assertForbidden();
    }

    public function test_client_can_post_public_comment(): void
    {
        $client = Client::factory()->create();
        $user = User::factory()->create([
            'role' => User::ROLE_CLIENT,
            'client_id' => $client->id,
        ]);
        $ticket = Ticket::factory()->create(['client_id' => $client->id]);

        $this->actingAs($user)->post(route('portal.tickets.comments.store', $ticket), [
            'body' => 'Preciso de actualização.',
        ])->assertRedirect(route('portal.tickets.show', $ticket));

        $this->assertDatabaseHas('ticket_interactions', [
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'body' => 'Preciso de actualização.',
            'is_internal' => false,
        ]);
    }

    public function test_agent_can_access_dashboard(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AGENT]);

        $this->actingAs($user)->get(route('dashboard'))->assertOk();
    }
}
