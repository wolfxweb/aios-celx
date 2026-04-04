<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipment extends Model
{
    /** @use HasFactory<\Database\Factories\EquipmentFactory> */
    use HasFactory;

    /** @var string */
    protected $table = 'equipments';

    protected $fillable = [
        'client_id', 'internal_code', 'type', 'brand', 'model', 'serial_number',
        'asset_tag', 'installed_at', 'warranty_until', 'location', 'status', 'technical_notes',
    ];

    protected function casts(): array
    {
        return [
            'installed_at' => 'date',
            'warranty_until' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
