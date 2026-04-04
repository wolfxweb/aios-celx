<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class TicketAttachmentController extends Controller
{
    public function store(Request $request, Ticket $ticket): RedirectResponse
    {
        Gate::authorize('update', $ticket);

        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $file = $request->file('file');
        $disk = config('filesystems.default', 'local');
        $path = $file->store('tickets/'.$ticket->id, $disk);

        TicketAttachment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size_bytes' => $file->getSize(),
        ]);

        return redirect()->route('tickets.show', $ticket)->with('status', 'Anexo enviado.');
    }

    public function destroy(Request $request, Ticket $ticket, TicketAttachment $attachment): RedirectResponse
    {
        Gate::authorize('update', $ticket);
        abort_unless($attachment->ticket_id === $ticket->id, 404);

        Storage::disk($attachment->disk)->delete($attachment->path);
        $attachment->delete();

        return redirect()->route('tickets.show', $ticket)->with('status', 'Anexo removido.');
    }
}
