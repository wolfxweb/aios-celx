@php
    $c = $contact ?? new \App\Models\Contact();
@endphp
<div class="field">
    <label for="name">Nome *</label>
    <input id="name" name="name" value="{{ old('name', $c->name) }}" required>
    @error('name')<div class="error">{{ $message }}</div>@enderror
</div>
<div class="field">
    <label for="position">Cargo</label>
    <input id="position" name="position" value="{{ old('position', $c->position) }}">
</div>
<div class="field">
    <label for="email">E-mail</label>
    <input id="email" type="email" name="email" value="{{ old('email', $c->email) }}">
</div>
<div class="field">
    <label for="phone">Telefone</label>
    <input id="phone" name="phone" value="{{ old('phone', $c->phone) }}">
</div>
<div class="field">
    <label for="whatsapp">WhatsApp</label>
    <input id="whatsapp" name="whatsapp" value="{{ old('whatsapp', $c->whatsapp) }}">
</div>
<div class="field">
    <label for="department">Departamento</label>
    <input id="department" name="department" value="{{ old('department', $c->department) }}">
</div>
<div class="field">
    <label for="notes">Observações</label>
    <textarea id="notes" name="notes" rows="2">{{ old('notes', $c->notes) }}</textarea>
</div>
<div class="field">
    <label><input type="checkbox" name="can_open_tickets" value="1" @checked(old('can_open_tickets', $c->can_open_tickets ?? true))> Pode abrir chamados</label>
</div>
<div class="field">
    <label><input type="checkbox" name="is_primary" value="1" @checked(old('is_primary', $c->is_primary ?? false))> Contacto principal</label>
</div>
