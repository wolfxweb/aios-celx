@extends('layouts.app')

@section('title', 'Abrir ticket')

@section('content')
    <h1 style="margin-top:0;">Abrir ticket</h1>
    <div
        class="card"
        x-data="{
            clients: {{ json_encode($clientsOptions) }},
            clientId: {{ json_encode(old('client_id') ?? '') }},
            contactId: {{ json_encode(old('contact_id') ?? '') }},
            equipmentId: {{ json_encode(old('equipment_id') ?? '') }},
            get row() {
                return this.clients.find(c => String(c.id) === String(this.clientId));
            },
            get contacts() { return this.row?.contacts ?? []; },
            get equipments() { return this.row?.equipments ?? []; }
        }"
    >
        <form method="post" action="{{ route('tickets.store') }}">
            @csrf
            <div class="field">
                <label for="client_id">Cliente *</label>
                <select id="client_id" name="client_id" x-model="clientId" @change="contactId = ''; equipmentId = ''" required>
                    <option value="">—</option>
                    @foreach ($clients as $cl)
                        <option value="{{ $cl->id }}">{{ $cl->company_name }}</option>
                    @endforeach
                </select>
                @error('client_id')<div class="error">{{ $message }}</div>@enderror
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
                        <option value="{{ $val }}" @selected(old('priority', 'normal') === $val)>{{ $label }}</option>
                    @endforeach
                </select>
            </div>
            <div class="field">
                <label for="category">Categoria</label>
                <input id="category" name="category" value="{{ old('category') }}">
            </div>
            <div class="field">
                <label for="title">Título *</label>
                <input id="title" name="title" value="{{ old('title') }}" required>
                @error('title')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label for="description">Descrição</label>
                <textarea id="description" name="description" rows="5">{{ old('description') }}</textarea>
            </div>
            <div class="field">
                <label for="source">Origem</label>
                <select id="source" name="source">
                    @foreach (['internal' => 'Interno', 'phone' => 'Telefone', 'email' => 'E-mail', 'portal' => 'Portal'] as $val => $label)
                        <option value="{{ $val }}" @selected(old('source', 'internal') === $val)>{{ $label }}</option>
                    @endforeach
                </select>
            </div>
            <button type="submit" class="btn btn-primary">Criar ticket</button>
            <a href="{{ route('tickets.index') }}" class="btn btn-ghost">Cancelar</a>
        </form>
    </div>
@endsection
