<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
     /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'icon',
        'name_color',
        'status',
    ];

    public function criteria()
    {
        return $this->hasMany(Criterion::class);
    }

    public function judges(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'event_user', 'event_id', 'user_id')
            ->wherePivot('status', 'active')
            ->where('role', 'judge'); // <-- filter to only users with role 'judge'
    }

    public function contestants()
    {
        return $this->hasMany(Contestant::class)->orderBy('sort_order')->orderBy('id');
    }

    public function scores()
    {
        return $this->hasMany(Score::class);
    }

    public function specialAwards(): HasMany
    {
        return $this->hasMany(SpecialAward::class);
    }

}
