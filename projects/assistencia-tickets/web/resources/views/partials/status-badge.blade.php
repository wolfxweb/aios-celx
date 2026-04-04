@php
    $labels = [
        'new' => 'Novo',
        'in_progress' => 'Em atendimento',
        'waiting_customer' => 'Aguardando cliente',
        'waiting_part' => 'Aguardando peça',
        'resolved' => 'Resolvido',
        'closed' => 'Encerrado',
        'cancelled' => 'Cancelado',
    ];
    $colors = [
        'new' => 'var(--status-new)',
        'in_progress' => 'var(--status-in-progress)',
        'waiting_customer' => 'var(--status-waiting-customer)',
        'waiting_part' => 'var(--status-waiting-part)',
        'resolved' => 'var(--status-resolved)',
        'closed' => 'var(--status-closed)',
        'cancelled' => 'var(--status-cancelled)',
    ];
    $label = $labels[$status] ?? $status;
    $color = $colors[$status] ?? '#64748B';
@endphp
<span class="badge" style="background: {{ $color }};">{{ $label }}</span>
