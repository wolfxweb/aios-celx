<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ContactController extends Controller
{
    public function index(Client $client): View
    {
        $contacts = $client->contacts()->orderBy('name')->get();

        return view('contacts.index', compact('client', 'contacts'));
    }

    public function create(Client $client): View
    {
        return view('contacts.create', compact('client'));
    }

    public function store(Request $request, Client $client): RedirectResponse
    {
        $data = $this->validated($request);
        $data['can_open_tickets'] = $request->boolean('can_open_tickets', true);
        $data['is_primary'] = $request->boolean('is_primary');

        $contact = $client->contacts()->create($data);
        $this->syncPrimary($client, $contact);

        return redirect()->route('clients.show', $client)->with('status', 'Contacto criado.');
    }

    public function edit(Client $client, Contact $contact): View
    {
        return view('contacts.edit', compact('client', 'contact'));
    }

    public function update(Request $request, Client $client, Contact $contact): RedirectResponse
    {
        $data = $this->validated($request);
        $data['can_open_tickets'] = $request->boolean('can_open_tickets', true);
        $data['is_primary'] = $request->boolean('is_primary');

        $contact->update($data);
        $this->syncPrimary($client, $contact->fresh());

        return redirect()->route('clients.show', $client)->with('status', 'Contacto actualizado.');
    }

    public function destroy(Client $client, Contact $contact): RedirectResponse
    {
        $contact->delete();

        return redirect()->route('clients.show', $client)->with('status', 'Contacto removido.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:64'],
            'whatsapp' => ['nullable', 'string', 'max:64'],
            'email' => ['nullable', 'email', 'max:255'],
            'department' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function syncPrimary(Client $client, Contact $contact): void
    {
        if (! $contact->is_primary) {
            return;
        }

        $client->contacts()
            ->where('id', '!=', $contact->id)
            ->update(['is_primary' => false]);
    }
}
