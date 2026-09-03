<?php

use App\Http\Controllers\Event\EventController;
use App\Http\Controllers\Judge\JudgeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/judge', [JudgeController::class, 'index'])->name('judge');

    Route::patch('/update-scores', [EventController::class, 'update_scores'])->name('update.scores');
    Route::get('/judge/updated-event/{id}', [EventController::class, 'judge_updated_event'])->name('judge.updated.event');
});
