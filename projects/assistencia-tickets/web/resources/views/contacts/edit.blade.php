@extends('layouts.app')

@section('title', 'Editar contacto')

@section('content')
    <h1 style="margin-top:0;">Editar contacto — {{ $client->company_name }}</h1>
    <form method="post" action="{{ route('clients.contacts.update', [$client, $contact]) }}" class="card">
        @csrf
        @method('PUT')
        @include('contacts._form', ['contact' => $contact])
        <button type="submit" class="btn btn-primary">Actualizar</button>
        <a href="{{ route('clients.show', $client) }}" class="btn btn-ghost">Cancelar</a>
    </form>
    <form method="post" action="{{ route('clients.contacts.destroy', [$client, $contact]) }}" onsubmit="return confirm('Remover este contacto?');" style="margin-top:1rem;">
        @csrf
        @method('DELETE')
        <button type="submit" class="btn btn-ghost" style="color:#B91C1C;">Eliminar contacto</button>
    </form>
@endsection
