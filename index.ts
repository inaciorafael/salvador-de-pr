import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';

// Instanciando o simples git
const git: SimpleGit = simpleGit();

// Função para obter a branch base (geralmente 'main' ou 'master')
const BASE_BRANCH = 'main'; // TODO: parametrizar

// Função para obter a branch atual
async function getCurrentBranch(): Promise<string> {
  const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
  return branch.trim();
}

// Função para criar uma nova branch a partir da branch base
async function createNewBranch(): Promise<void> {
  console.log(`Criando uma nova branch a partir de ${BASE_BRANCH}...`);

  // Criar e atualizar a branch base
  await git.checkout(BASE_BRANCH);
  await git.pull('origin', BASE_BRANCH);

  const newBranchName = `feature-branch-${Date.now()}`; // Nome da nova branch com timestamp
  await git.checkoutLocalBranch(newBranchName);

  console.log(`Nova branch ${newBranchName} criada com sucesso!`);
}

// Função para aplicar os commits da branch de trabalho na nova branch
async function applyCommitsToNewBranch(): Promise<void> {
  const currentBranch = await getCurrentBranch();

  // Obter os commits da branch atual
  const commits = await git.log([`${BASE_BRANCH}..${currentBranch}`]);

  console.log(`Aplicando ${commits.total} commits da branch ${currentBranch} para a nova branch...`);

  // Aplicar cada commit com cherry-pick
  for (const commit of commits.all) {
    try {
      console.log(`Aplicando commit ${commit.hash}...`);
      await git.raw(['cherry-pick', commit.hash]); // Usando git.raw para fazer o cherry-pick
      console.log(`Commit ${commit.hash} aplicado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao aplicar o commit ${commit.hash}: ${error.message}`);
      break; // Se houver erro ao aplicar um commit, interrompe o processo
    }
  }
}

// Função para fazer commit das mudanças na nova branch
async function commitChanges(): Promise<void> {
  await git.add('.');  // Adiciona todas as mudanças
  await git.commit('Comitando as mudanças preparadas para o PR');
  console.log('Mudanças commitadas com sucesso!');
}

// Função principal para rodar o fluxo
async function main(): Promise<void> {
  await createNewBranch();            // Criar a nova branch a partir da base
  await applyCommitsToNewBranch();    // Aplicar os commits da branch original na nova branch
  await commitChanges();              // Comitar as mudanças na nova branch

  console.log('Nova branch preparada para o PR com sucesso!');
}

// Chamada da função principal
main().catch(err => {
  console.error('Erro no processo:', err);
});
