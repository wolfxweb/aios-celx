@extends('layouts.app')

@section('title', 'Novo cliente')

@section('content')
    <h1 style="margin-top:0;">Novo cliente</h1>
    <form method="post" action="{{ route('clients.store') }}" class="card">
        @csrf
        @include('clients._form', ['client' => null])
        <button type="submit" class="btn btn-primary">Guardar</button>
        <a href="{{ route('clients.index') }}" class="btn btn-ghost">Cancelar</a>
    </form>
@endsection
