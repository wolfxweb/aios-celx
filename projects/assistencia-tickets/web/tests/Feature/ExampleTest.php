<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_shows_home_for_guest(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('Framework aios-celx', false)
            ->assertSee('Aplicação de exemplo', false);
    }

    public function test_root_redirects_authenticated_staff_to_dashboard(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AGENT]);

        $this->actingAs($user)->get('/')->assertRedirect(route('dashboard'));
    }

    public function test_root_redirects_authenticated_client_to_portal(): void
    {
        $client = Client::factory()->create();
        $user = User::factory()->create([
            'role' => User::ROLE_CLIENT,
            'client_id' => $client->id,
        ]);

        $this->actingAs($user)->get('/')->assertRedirect(route('portal.tickets.index'));
    }
}
