import simpleGit, { SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit();

const BASE_BRANCH = 'main'; // TODO: parametrizar

async function getCurrentBranch(): Promise<string> {
  const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
  return branch.trim();
}

async function createNewBranch(): Promise<void> {
  console.log(`Criando uma nova branch a partir de ${BASE_BRANCH}...`);

  await git.checkout(BASE_BRANCH);
  await git.pull('origin', BASE_BRANCH);

  const newBranchName = `feature-branch-${Date.now()}`;
  await git.checkoutLocalBranch(newBranchName);

  console.log(`Nova branch ${newBranchName} criada com sucesso!`);
}

async function applyCommitsToNewBranch(): Promise<void> {
  const currentBranch = await getCurrentBranch();

  const commits = await git.log([`${BASE_BRANCH}..${currentBranch}`]);

  console.log(`Aplicando ${commits.total} commits da branch ${currentBranch} para a nova branch...`);

  for (const commit of commits.all) {
    try {
      console.log(`Aplicando commit ${commit.hash}...`);
      await git.raw(['cherry-pick', commit.hash]);
      console.log(`Commit ${commit.hash} aplicado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao aplicar o commit ${commit.hash}: ${JSON.stringify(error)}`);
      break;
    }
  }
}

async function commitChanges(): Promise<void> {
  await git.add('.');
  await git.commit('Comitando as mudanças preparadas para o PR');
  console.log('Mudanças commitadas com sucesso!');
}

async function main(): Promise<void> {
  await createNewBranch();
  await applyCommitsToNewBranch();
  await commitChanges();

  console.log('Nova branch preparada para o PR com sucesso!');
}

main().catch(err => {
  console.error('Erro no processo:', err);
});
