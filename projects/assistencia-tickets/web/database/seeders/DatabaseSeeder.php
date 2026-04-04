<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrador',
                'password' => 'password',
                'role' => User::ROLE_ADMIN,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'tech@example.com'],
            [
                'name' => 'Técnico Demo',
                'password' => 'password',
                'role' => User::ROLE_TECHNICIAN,
            ]
        );

        $demoClient = Client::query()->updateOrCreate(
            ['code' => 'DEMO-001'],
            [
                'company_name' => 'Cliente Demo Ltda',
                'trade_name' => 'Demo',
                'is_active' => true,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'cliente@example.com'],
            [
                'name' => 'Contacto Cliente Demo',
                'password' => 'password',
                'role' => User::ROLE_CLIENT,
                'client_id' => $demoClient->id,
            ]
        );
    }
}
