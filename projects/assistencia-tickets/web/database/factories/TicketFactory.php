<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ticket>
 */
class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'priority' => 'normal',
            'status' => Ticket::STATUS_NEW,
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'source' => 'internal',
            'opened_at' => now(),
        ];
    }
}
