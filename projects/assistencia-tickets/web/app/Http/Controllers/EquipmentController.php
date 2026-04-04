<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Equipment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class EquipmentController extends Controller
{
    public function index(Client $client): View
    {
        $equipments = $client->equipment()->orderBy('internal_code')->orderBy('id')->get();

        return view('equipments.index', compact('client', 'equipments'));
    }

    public function create(Client $client): View
    {
        return view('equipments.create', compact('client'));
    }

    public function store(Request $request, Client $client): RedirectResponse
    {
        $data = $this->validated($request);
        $client->equipment()->create($data);

        return redirect()->route('clients.show', $client)->with('status', 'Equipamento criado.');
    }

    public function edit(Client $client, Equipment $equipment): View
    {
        return view('equipments.edit', compact('client', 'equipment'));
    }

    public function update(Request $request, Client $client, Equipment $equipment): RedirectResponse
    {
        $equipment->update($this->validated($request));

        return redirect()->route('clients.show', $client)->with('status', 'Equipamento actualizado.');
    }

    public function destroy(Client $client, Equipment $equipment): RedirectResponse
    {
        $equipment->delete();

        return redirect()->route('clients.show', $client)->with('status', 'Equipamento removido.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'internal_code' => ['nullable', 'string', 'max:64'],
            'type' => ['nullable', 'string', 'max:120'],
            'brand' => ['nullable', 'string', 'max:120'],
            'model' => ['nullable', 'string', 'max:120'],
            'serial_number' => ['nullable', 'string', 'max:120'],
            'asset_tag' => ['nullable', 'string', 'max:120'],
            'installed_at' => ['nullable', 'date'],
            'warranty_until' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive,maintenance'],
            'technical_notes' => ['nullable', 'string'],
        ]);
    }
}
