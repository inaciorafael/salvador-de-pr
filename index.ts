import simpleGit, { SimpleGit } from "simple-git";
import fs from 'fs'
import path from 'path'

const git: SimpleGit = simpleGit()

const BASE_BRANCH = 'main'

async function getCurrentBranch(): Promise<string> {
  const branch = await git.revparse(['--abbrev-ref', 'HEAD'])
  return branch.trim()
}

async function saveModifiedFiles(): Promise<void> {
  const currentBranch = await getCurrentBranch()
  const mergeBase = await git.raw(['merge-base', BASE_BRANCH, currentBranch])
  const diff = await git.diff([mergeBase.trim(), '--name-status'])

  fs.writeFileSync(path.join(__dirname, 'changes.diff'), diff)

  const status = await git.status()
  const modifiedFiles = status.modified

  fs.writeFileSync(path.join(__dirname, 'modifiedFiles.txt'), modifiedFiles.join('\n'))

  console.log('Arquivos modificados com sucesso!')
}

async function saveCreatedDeletedFiles(): Promise<void> {
  const currentBranch = await getCurrentBranch()
  const mergeBase = await git.raw(['merge-base', BASE_BRANCH, currentBranch])

  const createdDeletedFiles = await git.diff([mergeBase.trim(), '--name-status'])
  const createdFiles: string[] = []
  const deletedFiles: string[] = []

  createdDeletedFiles.split('\n').forEach(line => {
    const [status, file] = line.split('\t')

    if (status === 'A') {
      createdFiles.push(file)
    }

    if (status === 'D') {
      deletedFiles.push(file)
    }
  })

  fs.writeFileSync(path.join(__dirname, 'createdFiles.txt'), createdFiles.join('\n'))
  fs.writeFileSync(path.join(__dirname, 'deletedFiles.txt'), deletedFiles.join('\n'))
}

async function stashChanges(): Promise<void> {
  await git.stash()
  console.log('Mudanças armazenadas no stash com sucesso!')
}

async function main(): Promise<void>  {
  await saveModifiedFiles()
  await saveCreatedDeletedFiles()
  await stashChanges()

  console.log('Preparação para merge concluida')
}

main().catch(err => {
  console.error('Erro no processo', err)
})
