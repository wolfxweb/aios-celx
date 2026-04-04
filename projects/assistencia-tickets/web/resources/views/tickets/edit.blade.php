@extends('layouts.app')

@section('title', 'Editar '.$ticket->number)

@section('content')
    <h1 style="margin-top:0;">Editar {{ $ticket->number }}</h1>
    <div
        class="card"
        x-data="{
            clients: {{ json_encode($clientsOptions) }},
            clientId: {{ json_encode(old('client_id', $ticket->client_id) ?? '') }},
            contactId: {{ json_encode(old('contact_id', $ticket->contact_id) ?? '') }},
            equipmentId: {{ json_encode(old('equipment_id', $ticket->equipment_id) ?? '') }},
            get row() {
                return this.clients.find(c => String(c.id) === String(this.clientId));
            },
            get contacts() { return this.row?.contacts ?? []; },
            get equipments() { return this.row?.equipments ?? []; }
        }"
    >
        <form method="post" action="{{ route('tickets.update', $ticket) }}">
            @csrf
            @method('PUT')
            <div class="field">
                <label for="client_id">Cliente *</label>
                <select id="client_id" name="client_id" x-model="clientId" @change="contactId = ''; equipmentId = ''" required>
                    @foreach ($clients as $cl)
                        <option value="{{ $cl->id }}">{{ $cl->company_name }}</option>
                    @endforeach
                </select>
            </div>
            <div class="field">
                <label for="contact_id">Contacto</label>
                <select id="contact_id" name="contact_id" x-model="contactId">
                    <option value="">—</option>
                    <template x-for="c in contacts" :key="c.id">
                        <option :value="c.id" x-text="c.label"></option>
                    </template>
                </select>
            </div>
            <div class="field">
                <label for="equipment_id">Equipamento</label>
                <select id="equipment_id" name="equipment_id" x-model="equipmentId">
                    <option value="">—</option>
                    <template x-for="e in equipments" :key="e.id">
                        <option :value="e.id" x-text="e.label"></option>
                    </template>
                </select>
            </div>
            <div class="field">
                <label for="priority">Prioridade *</label>
                <select id="priority" name="priority" required>
                    @foreach (['low' => 'Baixa', 'normal' => 'Normal', 'high' => 'Alta', 'critical' => 'Crítica'] as $val => $label)
                        <option value="{{ $val }}" @selected(old('priority', $ticket->priority) === $val)>{{ $label }}</option>
                    @endforeach
                </select>
            </div>
            <div class="field">
                <label for="status">Estado *</label>
                <select id="status" name="status" required>
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
                    @endphp
                    @foreach ($labels as $st => $label)
                        <option value="{{ $st }}" @selected(old('status', $ticket->status) === $st)>{{ $label }}</option>
                    @endforeach
                </select>
            </div>
            <div class="field">
                <label for="assigned_to">Técnico atribuído</label>
                <select id="assigned_to" name="assigned_to">
                    <option value="">—</option>
                    @foreach ($users as $u)
                        <option value="{{ $u->id }}" @selected(old('assigned_to', $ticket->assigned_to) == $u->id)>{{ $u->name }}</option>
                    @endforeach
                </select>
            </div>
            <div class="field">
                <label for="title">Título *</label>
                <input id="title" name="title" value="{{ old('title', $ticket->title) }}" required>
            </div>
            <div class="field">
                <label for="description">Descrição</label>
                <textarea id="description" name="description" rows="4">{{ old('description', $ticket->description) }}</textarea>
            </div>
            <div class="field">
                <label for="root_cause">Causa raiz</label>
                <input id="root_cause" name="root_cause" value="{{ old('root_cause', $ticket->root_cause) }}">
            </div>
            <div class="field">
                <label for="solution">Solução</label>
                <textarea id="solution" name="solution" rows="3">{{ old('solution', $ticket->solution) }}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">Guardar</button>
            <a href="{{ route('tickets.show', $ticket) }}" class="btn btn-ghost">Cancelar</a>
        </form>
    </div>
@endsection
