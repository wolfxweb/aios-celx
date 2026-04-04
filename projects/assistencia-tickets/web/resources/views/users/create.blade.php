@extends('layouts.app')

@section('title', 'Novo utilizador')

@section('content')
    <h1 style="margin-top:0;">Novo utilizador</h1>
    <form method="post" action="{{ route('users.store') }}" class="card" x-data="{ role: '{{ old('role', 'agent') }}' }">
        @csrf
        <div class="field">
            <label for="name">Nome *</label>
            <input id="name" name="name" value="{{ old('name') }}" required>
        </div>
        <div class="field">
            <label for="email">E-mail *</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required>
        </div>
        <div class="field">
            <label for="role">Perfil *</label>
            <select id="role" name="role" required x-model="role">
                @foreach (['admin' => 'Administrador', 'agent' => 'Atendente', 'technician' => 'Técnico', 'supervisor' => 'Supervisor', 'client' => 'Cliente (portal)'] as $val => $label)
                    <option value="{{ $val }}">{{ $label }}</option>
                @endforeach
            </select>
        </div>
        <div class="field" x-show="role === 'client'" x-cloak>
            <label for="client_id">Cliente (empresa) *</label>
            <select id="client_id" name="client_id">
                <option value="">— Seleccionar —</option>
                @foreach ($clients as $c)
                    <option value="{{ $c->id }}" @selected(old('client_id') == $c->id)>{{ $c->company_name }}</option>
                @endforeach
            </select>
            @error('client_id')<div class="error">{{ $message }}</div>@enderror
        </div>
        <div class="field">
            <label for="password">Palavra-passe *</label>
            <input id="password" type="password" name="password" required autocomplete="new-password">
        </div>
        <div class="field">
            <label for="password_confirmation">Confirmar *</label>
            <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password">
        </div>
        @error('password')<div class="error">{{ $message }}</div>@enderror
        <button type="submit" class="btn btn-primary">Criar</button>
        <a href="{{ route('users.index') }}" class="btn btn-ghost">Cancelar</a>
    </form>
@endsection
