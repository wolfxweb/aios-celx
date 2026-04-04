@php
    $e = $equipment ?? new \App\Models\Equipment();
@endphp
<div class="field">
    <label for="internal_code">Código interno</label>
    <input id="internal_code" name="internal_code" value="{{ old('internal_code', $e->internal_code) }}">
</div>
<div class="field">
    <label for="type">Tipo</label>
    <input id="type" name="type" value="{{ old('type', $e->type) }}">
</div>
<div class="field">
    <label for="brand">Marca</label>
    <input id="brand" name="brand" value="{{ old('brand', $e->brand) }}">
</div>
<div class="field">
    <label for="model">Modelo</label>
    <input id="model" name="model" value="{{ old('model', $e->model) }}">
</div>
<div class="field">
    <label for="serial_number">N.º de série</label>
    <input id="serial_number" name="serial_number" value="{{ old('serial_number', $e->serial_number) }}">
</div>
<div class="field">
    <label for="asset_tag">Património</label>
    <input id="asset_tag" name="asset_tag" value="{{ old('asset_tag', $e->asset_tag) }}">
</div>
<div class="field">
    <label for="installed_at">Instalação</label>
    <input id="installed_at" type="date" name="installed_at" value="{{ old('installed_at', $e->installed_at?->format('Y-m-d')) }}">
</div>
<div class="field">
    <label for="warranty_until">Garantia até</label>
    <input id="warranty_until" type="date" name="warranty_until" value="{{ old('warranty_until', $e->warranty_until?->format('Y-m-d')) }}">
</div>
<div class="field">
    <label for="location">Localização</label>
    <input id="location" name="location" value="{{ old('location', $e->location) }}">
</div>
<div class="field">
    <label for="status">Situação *</label>
    <select id="status" name="status" required>
        @foreach (['active' => 'Activo', 'inactive' => 'Inactivo', 'maintenance' => 'Manutenção'] as $val => $label)
            <option value="{{ $val }}" @selected(old('status', $e->status ?? 'active') === $val)>{{ $label }}</option>
        @endforeach
    </select>
</div>
<div class="field">
    <label for="technical_notes">Observações técnicas</label>
    <textarea id="technical_notes" name="technical_notes" rows="3">{{ old('technical_notes', $e->technical_notes) }}</textarea>
</div>
