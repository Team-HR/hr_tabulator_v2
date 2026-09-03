<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('login');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('login');
    }

    public function login(Request $request)
    {
        // Validate request data
        $validated = $request->validate([
            'username' => 'required|string',  // Fixed pipe operator (| instead of |)
            'password' => 'required|string',
        ]);

        // Attempt authentication
        if (Auth::attempt($validated)) {
            // Regenerate session for security
            $request->session()->regenerate();

            // Return success response
            $user = Auth::user();
            if($user->role !== 'judge'){
                return to_route('home');
            } else {
                // return redirect()->intended(route('judge'));
                return to_route('judge');
            }

            
        }

        return back()->withErrors([
            'username' => 'The provided credentials do not match our records.',
        ])->onlyInput('username');
    }
}
