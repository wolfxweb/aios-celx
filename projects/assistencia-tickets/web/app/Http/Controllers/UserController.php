<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class UserController extends Controller
{
    public function index(): View
    {
        $users = User::query()->with('client:id,company_name')->orderBy('name')->simplePaginate(20);

        return view('users.index', compact('users'));
    }

    public function create(): View
    {
        $clients = Client::query()->where('is_active', true)->orderBy('company_name')->get(['id', 'company_name']);

        return view('users.create', compact('clients'));
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', 'in:admin,agent,technician,supervisor,client'],
            'client_id' => ['nullable', 'required_if:role,client', 'exists:clients,id'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'client_id' => $data['role'] === User::ROLE_CLIENT ? $data['client_id'] : null,
            'password' => $data['password'],
        ]);

        return redirect()->route('users.index')->with('status', 'Utilizador criado.');
    }

    public function edit(User $user): View
    {
        $clients = Client::query()->where('is_active', true)->orderBy('company_name')->get(['id', 'company_name']);

        return view('users.edit', compact('user', 'clients'));
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', 'string', 'in:admin,agent,technician,supervisor,client'],
            'client_id' => ['nullable', 'required_if:role,client', 'exists:clients,id'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->role = $data['role'];
        $user->client_id = $data['role'] === User::ROLE_CLIENT ? $data['client_id'] : null;
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();

        return redirect()->route('users.index')->with('status', 'Utilizador actualizado.');
    }
}
