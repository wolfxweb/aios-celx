@php
    $c = $client ?? new \App\Models\Client();
@endphp
<div class="field">
    <label for="code">Código</label>
    <input id="code" name="code" value="{{ old('code', $c->code) }}">
    @error('code')<div class="error">{{ $message }}</div>@enderror
</div>
<div class="field">
    <label for="company_name">Razão social *</label>
    <input id="company_name" name="company_name" value="{{ old('company_name', $c->company_name) }}" required>
    @error('company_name')<div class="error">{{ $message }}</div>@enderror
</div>
<div class="field">
    <label for="trade_name">Nome fantasia</label>
    <input id="trade_name" name="trade_name" value="{{ old('trade_name', $c->trade_name) }}">
</div>
<div class="field">
    <label for="tax_id">CPF/CNPJ</label>
    <input id="tax_id" name="tax_id" value="{{ old('tax_id', $c->tax_id) }}">
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
    <label for="city">Cidade</label>
    <input id="city" name="city" value="{{ old('city', $c->city) }}">
</div>
<div class="field">
    <label for="state">UF</label>
    <input id="state" name="state" maxlength="8" value="{{ old('state', $c->state) }}">
</div>
<div class="field">
    <label><input type="checkbox" name="is_active" value="1" @checked(old('is_active', $c->is_active ?? true))> Activo</label>
</div>
<div class="field">
    <label for="notes">Observações</label>
    <textarea id="notes" name="notes" rows="3">{{ old('notes', $c->notes) }}</textarea>
</div>
