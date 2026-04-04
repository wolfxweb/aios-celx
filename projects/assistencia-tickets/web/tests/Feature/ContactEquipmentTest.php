<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Contact;
use App\Models\Equipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactEquipmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_contact_for_client(): void
    {
        $user = User::factory()->create();
        $client = Client::factory()->create();

        $response = $this->actingAs($user)->post(route('clients.contacts.store', $client), [
            'name' => 'Maria Silva',
            'email' => 'maria@example.com',
            'can_open_tickets' => '1',
            'is_primary' => '1',
        ]);

        $response->assertRedirect(route('clients.show', $client));
        $this->assertDatabaseHas('contacts', [
            'client_id' => $client->id,
            'name' => 'Maria Silva',
            'email' => 'maria@example.com',
        ]);
    }

    public function test_user_can_create_equipment_for_client(): void
    {
        $user = User::factory()->create();
        $client = Client::factory()->create();

        $response = $this->actingAs($user)->post(route('clients.equipments.store', $client), [
            'type' => 'Notebook',
            'brand' => 'Dell',
            'model' => 'Latitude',
            'status' => 'active',
        ]);

        $response->assertRedirect(route('clients.show', $client));
        $this->assertDatabaseHas('equipments', [
            'client_id' => $client->id,
            'type' => 'Notebook',
            'status' => 'active',
        ]);
    }

    public function test_scoped_contact_edit_returns_404_for_other_client(): void
    {
        $user = User::factory()->create();
        $clientA = Client::factory()->create();
        $clientB = Client::factory()->create();
        $contact = Contact::factory()->create(['client_id' => $clientB->id]);

        $this->actingAs($user)
            ->get(route('clients.contacts.edit', [$clientA, $contact]))
            ->assertNotFound();
    }

    public function test_scoped_equipment_edit_ok(): void
    {
        $user = User::factory()->create();
        $client = Client::factory()->create();
        $equipment = Equipment::factory()->create(['client_id' => $client->id]);

        $this->actingAs($user)
            ->get(route('clients.equipments.edit', [$client, $equipment]))
            ->assertOk();
    }
}
