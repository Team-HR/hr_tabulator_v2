<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Contestant\ContestantController;
use App\Http\Controllers\Event\EventController;
use App\Http\Controllers\Judge\JudgeController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/sign-in', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/sign-in', [AuthController::class, 'login'])->name('login.post');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/sign-out', [AuthController::class, 'logout'])->name('logout');

    Route::get('/', [EventController::class, 'home'])->name('home');
    Route::get('/admin/event/{id}', [EventController::class, 'admin'])->name('admin');
    Route::get('updated-event/{id}', [EventController::class, 'updated_event'])->name('get.updated.event');

    Route::post('/event/create', [EventController::class, 'event_create'])->name('event.create');
    Route::patch('/event/update', [EventController::class, 'event_update'])->name('event.update');

    Route::post('/add-judge', [JudgeController::class, 'add_judge'])->name('event.add.judge');
    Route::delete('/remove-judge', [JudgeController::class, 'remove_judge'])->name('event.remove.judge');
    Route::post('/create-judge', [JudgeController::class, 'create_judge'])->name('event.create.judge');
    Route::patch('/update-judge', [JudgeController::class, 'update_judge'])->name('event.update.judge');

    Route::post('/create-contestant', [ContestantController::class, 'create_contestant'])->name('create.contestant');
    Route::delete('/remove-contestant', [ContestantController::class, 'remove_contestant'])->name('remove.contestant');
    Route::patch('/update-contestant', [ContestantController::class, 'update_contestant'])->name('update.contestant');
    Route::patch('/reorder-contestants', [ContestantController::class, 'reorder_contestants'])->name('reorder.contestants');

    Route::post('/create-award', [EventController::class, 'create_award'])->name('create.award');
    Route::patch('/remove-award', [EventController::class, 'remove_award'])->name('remove.award');
});

require __DIR__.'/judge.php';
