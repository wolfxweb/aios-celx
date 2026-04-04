@extends('layouts.app')

@section('title', 'Relatórios')

@section('content')
    <h1 style="margin-top:0;">Relatórios</h1>

    <form method="get" class="card" style="padding:1rem;margin-bottom:1rem;">
        <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:end;">
            <div class="field" style="margin:0;">
                <label for="from">De</label>
                <input type="date" id="from" name="from" value="{{ $from->format('Y-m-d') }}">
            </div>
            <div class="field" style="margin:0;">
                <label for="to">Até</label>
                <input type="date" id="to" name="to" value="{{ $to->format('Y-m-d') }}">
            </div>
            <button type="submit" class="btn btn-primary">Actualizar</button>
        </div>
    </form>

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Resumo do período</h2>
        <p>Tickets abertos: <strong>{{ $ticketsOpened }}</strong></p>
        <p>Tickets encerrados: <strong>{{ $ticketsClosed }}</strong></p>
        <p>Minutos apontados: <strong>{{ $minutesLogged }}</strong></p>
        <p>Tickets com SLA de resolução vencido (abertos): <strong>{{ $slaViolations }}</strong></p>
    </div>

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Stock actual por estado</h2>
        <ul style="margin:0;padding-left:1.2rem;">
            @forelse ($byStatus as $st => $n)
                <li>{{ $st }}: <strong>{{ $n }}</strong></li>
            @empty
                <li>Nenhum ticket.</li>
            @endforelse
        </ul>
    </div>
@endsection
