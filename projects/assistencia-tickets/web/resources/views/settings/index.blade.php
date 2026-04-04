@extends('layouts.app')

@section('title', 'SLA / Configuração')

@section('content')
    <h1 style="margin-top:0;">SLA (leitura)</h1>
    <p style="color:var(--text-secondary);">Valores definidos em <code>config/sla.php</code>. Alterar ficheiro e limpar cache de config em produção.</p>

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Primeira resposta (horas)</h2>
        <table>
            @foreach ($responseHours as $p => $h)
                <tr><td>{{ $p }}</td><td>{{ $h }} h</td></tr>
            @endforeach
        </table>
    </div>

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Resolução (horas)</h2>
        <table>
            @foreach ($resolutionHours as $p => $h)
                <tr><td>{{ $p }}</td><td>{{ $h }} h</td></tr>
            @endforeach
        </table>
    </div>

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Estados com pausa de SLA (resolução)</h2>
        <p>{{ implode(', ', $pauseStatuses) }}</p>
    </div>
@endsection
