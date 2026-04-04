@extends('layouts.app')

@section('title', 'Novo equipamento')

@section('content')
    <h1 style="margin-top:0;">Novo equipamento — {{ $client->company_name }}</h1>
    <form method="post" action="{{ route('clients.equipments.store', $client) }}" class="card">
        @csrf
        @include('equipments._form', ['equipment' => null])
        <button type="submit" class="btn btn-primary">Guardar</button>
        <a href="{{ route('clients.show', $client) }}" class="btn btn-ghost">Cancelar</a>
    </form>
@endsection
