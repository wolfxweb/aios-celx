@extends('layouts.app')

@section('title', 'Editar equipamento')

@section('content')
    <h1 style="margin-top:0;">Editar equipamento — {{ $client->company_name }}</h1>
    <form method="post" action="{{ route('clients.equipments.update', [$client, $equipment]) }}" class="card">
        @csrf
        @method('PUT')
        @include('equipments._form', ['equipment' => $equipment])
        <button type="submit" class="btn btn-primary">Actualizar</button>
        <a href="{{ route('clients.show', $client) }}" class="btn btn-ghost">Cancelar</a>
    </form>
    <form method="post" action="{{ route('clients.equipments.destroy', [$client, $equipment]) }}" onsubmit="return confirm('Remover este equipamento?');" style="margin-top:1rem;">
        @csrf
        @method('DELETE')
        <button type="submit" class="btn btn-ghost" style="color:#B91C1C;">Eliminar equipamento</button>
    </form>
@endsection
