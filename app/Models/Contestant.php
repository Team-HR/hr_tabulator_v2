<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contestant extends Model
{
       /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'event_id',
        'name',
        'sort_order',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
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
