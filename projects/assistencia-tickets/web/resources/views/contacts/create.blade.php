@extends('layouts.app')

@section('title', 'Novo contacto')

@section('content')
    <h1 style="margin-top:0;">Novo contacto — {{ $client->company_name }}</h1>
    <form method="post" action="{{ route('clients.contacts.store', $client) }}" class="card">
        @csrf
        @include('contacts._form', ['contact' => null])
        <button type="submit" class="btn btn-primary">Guardar</button>
        <a href="{{ route('clients.show', $client) }}" class="btn btn-ghost">Cancelar</a>
    </form>
@endsection
