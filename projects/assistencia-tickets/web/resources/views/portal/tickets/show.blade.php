@extends('layouts.portal')

@section('title', $ticket->number)

@section('content')
    <p style="margin:0 0 0.5rem;"><a href="{{ route('portal.tickets.index') }}">← Voltar à lista</a></p>
    <h1 style="margin-top:0;">{{ $ticket->number }}</h1>
    <p style="color:var(--text-secondary);margin-top:0;">{{ $ticket->title }}</p>

    <div class="card">
        <p><strong>Estado:</strong> @include('partials.status-badge', ['status' => $ticket->status])</p>
        <p><strong>Prioridade:</strong> {{ $ticket->priority }}</p>
        <p><strong>Aberto em:</strong> {{ $ticket->opened_at?->format('d/m/Y H:i') }}</p>
        @if ($ticket->description)
            <p style="white-space:pre-wrap;"><strong>Descrição:</strong><br>{{ $ticket->description }}</p>
        @endif
    </div>

    <h2 style="font-size:1.1rem;">Mensagens</h2>
    <div class="card">
        @forelse ($ticket->interactions as $i)
            <div style="border-bottom:1px solid var(--border);padding:0.75rem 0;margin:0;">
                <div style="font-size:0.8rem;color:var(--text-secondary);">
                    {{ $i->user?->name ?? '—' }} · {{ $i->created_at->format('d/m/Y H:i') }}
                </div>
                <div style="white-space:pre-wrap;margin-top:0.35rem;">{{ $i->body }}</div>
            </div>
        @empty
            <p style="margin:0;color:var(--text-secondary);">Ainda não há mensagens públicas neste pedido.</p>
        @endforelse
    </div>

    <h2 style="font-size:1.1rem;">Enviar mensagem</h2>
    <form method="post" action="{{ route('portal.tickets.comments.store', $ticket) }}" class="card">
        @csrf
        <div class="field">
            <label for="body">Mensagem</label>
            <textarea id="body" name="body" required placeholder="Escreva a sua mensagem…">{{ old('body') }}</textarea>
            @error('body')<div style="color:#B91C1C;font-size:0.8rem;">{{ $message }}</div>@enderror
        </div>
        <button type="submit" class="btn btn-primary">Enviar</button>
    </form>
@endsection
