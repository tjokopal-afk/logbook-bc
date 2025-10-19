export * from './profiles'
export * from './projects'
export * from './participants'
export * from './tasks'
export * from './logbook'
export * from './reviews'
export * from './documents'
export * from './audit'

export { default as profiles } from './profiles'
export { default as projects } from './projects'
export { default as participants } from './participants'
export { default as tasks } from './tasks'
export { default as logbook } from './logbook'
export { default as reviews } from './reviews'
export { default as documents } from './documents'
export { default as audit } from './audit'

import {
	getProfileByUserId,
	getProfileByUsername,
	updateProfile,
} from './profiles'

import { getProjects, createProject, updateProject } from './projects'

import { addProjectParticipant, removeProjectParticipant, listProjectParticipants } from './participants'

import { getTasks, createTask, updateTask } from './tasks'

import { createLogbookEntry, getLogbookEntries } from './logbook'

import { createReview, getReviews } from './reviews'

import { createProjectDocument, getProjectDocuments } from './documents'

import { logAudit } from './audit'

const api = {
	// profiles
	getProfileByUserId,
	getProfileByUsername,
	updateProfile,
	// projects
	getProjects,
	createProject,
	updateProject,
	// participants
	addProjectParticipant,
	removeProjectParticipant,
	listProjectParticipants,
	// tasks
	getTasks,
	createTask,
	updateTask,
	// logbook
	createLogbookEntry,
	getLogbookEntries,
	// reviews
	createReview,
	getReviews,
	// docs
	createProjectDocument,
	getProjectDocuments,
	// audit
	logAudit,
}

export default api
