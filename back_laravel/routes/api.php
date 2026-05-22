<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

Route::get('/ping', function() {
    return response()->json(['message' => 'Liaison Angular-Laravel OK !']);
});
use App\Http\Controllers\ClasseController;

Route::get('/classes', [ClasseController::class, 'index']);
Route::post('/classes', [ClasseController::class, 'store']);
Route::delete('/classes/{id}', [ClasseController::class, 'destroy']);