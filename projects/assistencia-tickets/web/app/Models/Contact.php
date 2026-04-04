<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contact extends Model
{
    /** @use HasFactory<\Database\Factories\ContactFactory> */
    use HasFactory;

    protected $fillable = [
        'client_id', 'name', 'position', 'phone', 'whatsapp', 'email',
        'department', 'notes', 'can_open_tickets', 'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'can_open_tickets' => 'boolean',
            'is_primary' => 'boolean',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
