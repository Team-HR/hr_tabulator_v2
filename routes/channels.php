<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('scores-updated.{adminId}', function ($authUser, $adminId) {
    return (int) $authUser->id === (int) $adminId;
});

Broadcast::channel('event-updated.{eventId}', function ($authUser, $eventId) {
    if ($authUser->role === 'administrator') {
        return true;
    }

    return \App\Models\EventUser::where('user_id', $authUser->id)
        ->where('event_id', $eventId)
        ->where('status', 'active')
        ->exists();
});

