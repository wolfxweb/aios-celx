<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_requires_authentication(): void
    {
        $this->getJson('/api/v1/tickets')->assertUnauthorized();
    }

    public function test_authenticated_user_can_list_tickets_via_api(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Ticket::factory()->count(2)->create();

        $response = $this->getJson('/api/v1/tickets');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'current_page']);
    }

    public function test_authenticated_user_can_create_ticket_via_api(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $client = Client::factory()->create();

        $response = $this->postJson('/api/v1/tickets', [
            'client_id' => $client->id,
            'priority' => 'normal',
            'title' => 'Falha de rede',
            'description' => 'Detalhes',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('tickets', [
            'client_id' => $client->id,
            'title' => 'Falha de rede',
            'status' => Ticket::STATUS_NEW,
        ]);
    }
}
