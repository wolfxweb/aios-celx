@extends('layouts.app')

@section('title', 'Editar cliente')

@section('content')
    <h1 style="margin-top:0;">Editar cliente</h1>
    <form method="post" action="{{ route('clients.update', $client) }}" class="card">
        @csrf
        @method('PUT')
        @include('clients._form', ['client' => $client])
        <button type="submit" class="btn btn-primary">Actualizar</button>
        <a href="{{ route('clients.show', $client) }}" class="btn btn-ghost">Cancelar</a>
    </form>
@endsection
