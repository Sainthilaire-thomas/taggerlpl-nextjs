// src/app/api/git/current-commit/route.ts

/**
 * API endpoint pour récupérer le commit Git actuel
 * Utilisé lors de la création de versions pour tracer le code source
 */

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Récupérer le hash du commit actuel
    const { stdout: commit } = await execAsync('git rev-parse HEAD');
    
    // Récupérer le tag Git si existant
    let tag: string | null = null;
    try {
      const { stdout: tagOutput } = await execAsync('git describe --tags --exact-match HEAD 2>/dev/null || echo ""');
      tag = tagOutput.trim() || null;
    } catch {
      // Pas de tag sur ce commit
    }

    // Récupérer la branche courante
    const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');

    // Récupérer le dernier message de commit
    const { stdout: message } = await execAsync('git log -1 --pretty=%B');

    // Vérifier s'il y a des modifications non commitées
    const { stdout: status } = await execAsync('git status --porcelain');
    const hasUncommittedChanges = status.trim().length > 0;

    return NextResponse.json({
      commit: commit.trim(),
      tag: tag,
      branch: branch.trim(),
      message: message.trim(),
      hasUncommittedChanges,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting git info:', error);
    
    return NextResponse.json(
      {
        error: 'Unable to retrieve git information',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
