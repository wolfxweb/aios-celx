@extends('layouts.portal')

@section('title', 'Os meus pedidos')

@section('content')
    <h1 style="margin-top:0;">Os meus pedidos</h1>
    <p style="color:var(--text-secondary);">Acompanhe o estado dos seus tickets de assistência.</p>

    <div class="card" style="padding:0;overflow:auto;">
        <table>
            <thead>
            <tr>
                <th>Número</th>
                <th>Título</th>
                <th>Prioridade</th>
                <th>Estado</th>
                <th>Aberto em</th>
            </tr>
            </thead>
            <tbody>
            @forelse ($tickets as $ticket)
                <tr>
                    <td><a href="{{ route('portal.tickets.show', $ticket) }}">{{ $ticket->number }}</a></td>
                    <td>{{ \Illuminate\Support\Str::limit($ticket->title, 60) }}</td>
                    <td>{{ $ticket->priority }}</td>
                    <td>@include('partials.status-badge', ['status' => $ticket->status])</td>
                    <td>{{ $ticket->opened_at?->format('d/m/Y H:i') }}</td>
                </tr>
            @empty
                <tr><td colspan="5">Nenhum ticket encontrado.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    {{ $tickets->links() }}
@endsection
