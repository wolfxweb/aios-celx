<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Equipment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Equipment>
 */
class EquipmentFactory extends Factory
{
    protected $model = Equipment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'internal_code' => fake()->optional()->bothify('EQ-####'),
            'type' => fake()->randomElement(['Servidor', 'Switch', 'Posto']),
            'brand' => fake()->company(),
            'model' => fake()->word(),
            'status' => 'active',
        ];
    }
}
