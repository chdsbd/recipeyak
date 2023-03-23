import produce from "immer"
import orderBy from "lodash-es/orderBy"
import React, { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

import * as api from "@/api"
import { INote, IRecipe, RecipeTimelineItem, Upload } from "@/api"
import { classNames as cls } from "@/classnames"
import { Avatar } from "@/components/Avatar"
import { Box } from "@/components/Box"
import { Button } from "@/components/Buttons"
import { Textarea } from "@/components/Forms"
import { Markdown } from "@/components/Markdown"
import { RotatingLoader } from "@/components/RoatingLoader"
import { formatAbsoluteDateTime, formatHumanDateTime } from "@/date"
import { useUserId } from "@/hooks"
import {
  findReaction,
  ReactionPopover,
  ReactionsFooter,
  ReactionType,
} from "@/pages/recipe-detail/Reactions"
import { useNoteCreate } from "@/queries/noteCreate"
import { useNoteDelete } from "@/queries/noteDelete"
import { useNoteUpdate } from "@/queries/noteUpdate"
import { useReactionCreate } from "@/queries/reactionCreate"
import { useReactionDelete } from "@/queries/reactionDelete"
import { isOk } from "@/result"
import { styled } from "@/theme"
import { toast } from "@/toast"
import { notUndefined } from "@/utils/general"
import { imgixFmt } from "@/utils/url"
import { uuid4 } from "@/uuid"

interface IUseNoteEditHandlers {
  readonly note: INote
  readonly recipeId: IRecipe["id"]
}
function useNoteEditHandlers({ note, recipeId }: IUseNoteEditHandlers) {
  const [draftText, setNewText] = useState(note.text)
  useEffect(() => {
    setNewText(note.text)
  }, [note.text])
  const [isEditing, setIsEditing] = React.useState(false)
  const [uploadedImages, setUploads] = React.useState<UploadSuccess[]>(
    note.attachments.map((x) => ({ ...x, localId: x.id })),
  )

  const deleteNote = useNoteDelete()
  const updateNote = useNoteUpdate()

  const onSave = () => {
    updateNote.mutate(
      {
        recipeId,
        noteId: note.id,
        note: draftText,
        attachmentUploadIds: uploadedImages.map((x) => x.id),
      },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      },
    )
  }
  const setEditing = (value: boolean) => {
    setIsEditing(value)
  }
  const onCancel = () => {
    setEditing(false)
  }
  const onDelete = () => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate({
        recipeId,
        noteId: note.id,
      })
    }
  }
  const onEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      onCancel()
    }
    if (e.key === "Enter" && e.metaKey) {
      onSave()
    }
  }
  const onEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewText(e.target.value)
  }
  const onNoteClick = () => {
    setEditing(true)
  }
  return {
    draftText,
    isEditing,
    isUpdating: updateNote.isLoading,
    onCancel,
    onDelete,
    onEditorChange,
    onEditorKeyDown,
    onNoteClick,
    onSave,
    uploadedImages,
    addUploads: (upload: UploadSuccess) => {
      setUploads((s) => [upload, ...s])
    },
    removeUploads: (localIds: string[]) => {
      setUploads((s) => {
        return s.filter((u) => !localIds.includes(u.localId))
      })
    },
    resetUploads: () => {
      setUploads(note.attachments)
    },
  }
}

const SmallTime = styled.time`
  font-size: 0.85rem;
`

function NoteTimeStamp({ created }: { readonly created: string }) {
  const date = new Date(created)
  const prettyDate = formatAbsoluteDateTime(date, { includeYear: true })
  const humanizedDate = formatHumanDateTime(date)
  return (
    <SmallTime title={prettyDate} dateTime={created} className="text-muted">
      {humanizedDate}
    </SmallTime>
  )
}

function SharedEntry({
  id,
  children,
  className,
}: {
  readonly id: string
  readonly children: React.ReactNode
  readonly className?: string
}) {
  const location = useLocation()
  const isSharedNote = location.hash === `#${id}`
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (isSharedNote) {
      ref.current?.scrollIntoView()
    }
  }, [isSharedNote])
  return (
    <div
      ref={ref}
      className={cls(
        {
          "bg-highlight": isSharedNote,
        },
        className,
      )}
      id={id}
    >
      {children}
    </div>
  )
}

const SmallAnchor = styled.a`
  font-size: 0.825rem;
`

interface INoteProps {
  readonly note: INote
  readonly recipeId: IRecipe["id"]
  readonly className?: string
  readonly openImage: (id: string) => void
}
export function Note({ note, recipeId, className, openImage }: INoteProps) {
  const {
    draftText,
    isEditing,
    isUpdating,
    onCancel,
    onDelete,
    onEditorChange,
    onEditorKeyDown,
    onNoteClick,
    onSave,
    addUploads,
    removeUploads,
    uploadedImages,
    resetUploads,
  } = useNoteEditHandlers({ note, recipeId })

  const userId = useUserId()

  const noteHtmlId = `note-${note.id}`

  const { addFiles, removeFile, files, hasUnsavedImages, reset } =
    useImageUpload(
      addUploads,
      removeUploads,
      uploadedImages,
      resetUploads,
      recipeId,
    )

  const createReaction = useReactionCreate()
  const deleteReaction = useReactionDelete()

  const addOrRemoveReaction = async (emoji: ReactionType) => {
    const existingReaction = findReaction(note.reactions, emoji, userId ?? 0)
    if (existingReaction != null) {
      // remove reaction
      deleteReaction.mutate({
        recipeId,
        noteId: note.id,
        reactionId: existingReaction.id,
      })
    } else {
      createReaction.mutate({
        recipeId,
        noteId: note.id,
        type: emoji,
      })
    }
  }

  return (
    <SharedEntry
      className={cls("d-flex align-items-start", className)}
      id={noteHtmlId}
    >
      <Avatar avatarURL={note.created_by.avatar_url} className="mr-2" />
      <div className="w-100">
        <Box align="center">
          <b>{note.created_by.name}</b>{" "}
          <a href={`#${noteHtmlId}`} className="ml-2">
            <NoteTimeStamp created={note.created} />
          </a>
          <ReactionPopover
            className="ml-auto no-print"
            onPick={async (emoji) => addOrRemoveReaction(emoji)}
            reactions={note.reactions}
          />
          {note.created_by.id === userId ? (
            <SmallAnchor
              className="ml-2 text-muted cursor-pointer no-print"
              onClick={onNoteClick}
            >
              edit
            </SmallAnchor>
          ) : null}
        </Box>
        {!isEditing ? (
          <Box dir="col">
            <Markdown className="selectable">{note.text}</Markdown>
            <Box gap={1} dir="col">
              <Box wrap gap={1}>
                {note.attachments.map((attachment) => (
                  <ImagePreview
                    key={attachment.id}
                    onClick={() => {
                      openImage(attachment.id)
                    }}
                    src={attachment.url}
                    backgroundUrl={attachment.backgroundUrl}
                  />
                ))}
              </Box>
              <ReactionsFooter
                reactions={note.reactions}
                onPick={async (emoji) => addOrRemoveReaction(emoji)}
                onClick={async (emoji) => addOrRemoveReaction(emoji)}
              />
            </Box>
          </Box>
        ) : (
          <>
            <UploadContainer addFiles={addFiles}>
              <Textarea
                autoFocus
                bottomFlat
                onKeyDown={onEditorKeyDown}
                minRows={5}
                value={draftText}
                onChange={onEditorChange}
                placeholder="Add a note..."
              />
              {isEditing ? (
                <ImageUploader
                  addFiles={addFiles}
                  removeFile={removeFile}
                  files={files}
                />
              ) : (
                <Box wrap gap={1}>
                  {note.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      target="_blank"
                      rel="noreferrer"
                      href={attachment.url}
                    >
                      <ImagePreview
                        src={attachment.url}
                        backgroundUrl={attachment.backgroundUrl}
                      />
                    </a>
                  ))}
                </Box>
              )}
            </UploadContainer>

            {isEditing && (
              <Box space="between" align="center">
                <Button variant="danger" size="small" onClick={onDelete}>
                  delete
                </Button>
                <Box gap={3} space="between" align="center">
                  <Button
                    size="small"
                    onClick={() => {
                      onCancel()
                      reset()
                    }}
                  >
                    cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={onSave}
                    loading={isUpdating}
                    disabled={hasUnsavedImages}
                  >
                    save
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </div>
    </SharedEntry>
  )
}

export function TimelineEvent({
  event,
  enableLinking = true,
  className,
}: {
  readonly event: Pick<
    RecipeTimelineItem,
    "id" | "created_by" | "action" | "created"
  >
  readonly enableLinking?: boolean
  readonly className?: string
}) {
  const eventId = `event-${event.id}`
  const timestamp = <NoteTimeStamp created={event.created} />
  return (
    <SharedEntry
      id={eventId}
      className={cls("d-flex align-items-center", className)}
    >
      <Avatar
        avatarURL={event.created_by?.avatar_url ?? null}
        className="mr-2"
      />
      <div className="d-flex flex-column">
        <div>
          <b>{event.created_by?.name ?? "User"}</b>{" "}
          <span>{event.action} this recipe </span>
        </div>
        {enableLinking ? <a href={`#${eventId}`}>{timestamp}</a> : timestamp}
      </div>
    </SharedEntry>
  )
}

export const blurNoteTextArea = () => {
  const el = document.getElementById("new_note_textarea")
  if (el) {
    el.blur()
  }
}

interface IUseNoteCreatorHandlers {
  readonly recipeId: IRecipe["id"]
}

// TODO: inline this function instead of having a hook
function useNoteCreatorHandlers({ recipeId }: IUseNoteCreatorHandlers) {
  const [draftText, setDraftText] = React.useState("")
  const [isEditing, setIsEditing] = React.useState(false)
  const [uploadedImages, setUploads] = React.useState<UploadSuccess[]>([])

  const cancelEditingNote = () => {
    setIsEditing(false)
    setDraftText("")
    setUploads([])
    blurNoteTextArea()
  }

  const createNote = useNoteCreate()

  const onCreate = () => {
    createNote.mutate(
      {
        recipeId,
        note: draftText,
        uploadIds: uploadedImages.map((x) => x.id),
      },
      {
        onSuccess: () => {
          cancelEditingNote()
        },
        onError: () => {
          toast.error("Problem adding note to recipe")
        },
      },
    )
  }
  const onCancel = () => {
    cancelEditingNote()
  }
  const onEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      cancelEditingNote()
    }
    if (e.key === "Enter" && e.metaKey) {
      onCreate()
    }
  }
  const onEditorFocus = () => {
    setIsEditing(true)
  }
  const onEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftText(e.target.value)
  }

  const editorText = isEditing ? draftText : ""
  const editorRowCount = !isEditing ? 1 : undefined
  const editorMinRowCount = isEditing ? 5 : 0

  const isDisabled = editorText === "" && uploadedImages.length === 0

  return {
    isEditing,
    onEditorKeyDown,
    onEditorChange,
    editorMinRowCount,
    editorRowCount,
    editorText,
    onEditorFocus,
    onCreate,
    isLoading: createNote.isLoading,
    onCancel,
    isDisabled,
    addUploads: (upload: UploadSuccess) => {
      setUploads((s) => [upload, ...s])
    },
    removeUploads: (localIds: string[]) => {
      setUploads((s) => {
        return s.filter((u) => !localIds.includes(u.localId))
      })
    },
    uploadedImages,
    resetUploads: () => {
      setUploads([])
    },
  }
}

interface INoteCreatorProps {
  readonly recipeId: IRecipe["id"]
  readonly className?: string
}

const DragDropLabel = styled.label`
  font-size: 0.85rem;
  cursor: pointer;
  border-style: solid;
  border-top-style: none;
  border-width: thin;
  border-color: var(--color-border);
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  padding-top: 0.1rem;
  padding-bottom: 0.1rem;
  font-weight: 500;
  background-color: var(--color-background-card);
`

const NoteWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const ImageUploadContainer = styled.div`
  border-style: solid;
  border-top-style: none;
  border-width: thin;
  border-color: var(--color-border);
  background-color: var(--color-background-card);
  padding: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`

const ImagePreviewParent = styled.div`
  position: relative;
`
const CloseButton = styled.button`
  z-index: 10;
  position: absolute;
  right: 0;
  padding: 0.3rem;
  cursor: pointer;
  top: -4px;
  border-radius: 100%;
  aspect-ratio: 1;
  line-height: 0;
  border-width: 0;
  background-color: #4a4a4a;
  color: #dbdbdb;
  font-weight: 700;
`

const Image100Px = styled.img.attrs({ loading: "lazy" })<{
  readonly isLoading?: boolean
  readonly src: string
}>`
  height: 100px;
  width: 100px;
  border-radius: 6px;
  object-fit: cover;
  filter: ${(props) => (props.isLoading ? "grayscale(100%)" : "unset")};
`
function ImagePreview({
  src,
  isLoading,
  backgroundUrl,
  onClick,
}: {
  src: string
  isLoading?: boolean
  backgroundUrl: string | null
  onClick?: () => void
}) {
  return (
    <div className="d-grid" onClick={onClick}>
      <Image100Px
        src={imgixFmt(src)}
        isLoading={isLoading}
        style={{
          gridArea: "1 / 1",
          zIndex: 10,
        }}
      />
      {backgroundUrl != null && (
        <div
          style={{
            gridArea: "1 / 1",
            backgroundImage: `url(${backgroundUrl})`,
          }}
          className="blurred-filter"
        />
      )}
    </div>
  )
}

const LoaderContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  display: flex;
`

const BrokenImageContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  display: flex;
`

const BrokenImage = styled.div`
  margin: auto;
  font-size: 2rem;
`

// todo: clear changes on cancellation
function useImageUpload(
  addUploads: (upload: UploadSuccess) => void,
  removeUploads: (uploadIds: string[]) => void,
  remoteImages: Upload[],
  resetUploads: () => void,
  recipeId: number,
) {
  const [localImages, setLocalImages] = React.useState<InProgressUpload[]>([])

  const addFiles = (files: FileList) => {
    for (const file of files) {
      const fileId = uuid4()
      setLocalImages((s) => {
        return [
          {
            id: fileId,
            file,
            localId: fileId,
            url: URL.createObjectURL(file),
            state: "loading",
            progress: 0,
            type: "in-progress",
          } as const,
          ...s,
        ]
      })
      void api
        .uploadImage({
          image: file,
          recipeId,
          onProgress(progress) {
            setLocalImages(
              produce((s) => {
                const f = s.find((x) => x.localId === fileId)
                if (f) {
                  f.progress = progress
                }
              }),
            )
          },
        })
        .then((res) => {
          if (isOk(res)) {
            addUploads({
              ...res.data,
              type: "upload",
              localId: fileId,
              backgroundUrl: null,
              isPrimary: false,
            })
            setLocalImages(
              produce((s) => {
                const f = s.find((x) => x.localId === fileId)
                if (f) {
                  f.state = "success"
                }
              }),
            )
          } else {
            setLocalImages(
              produce((s) => {
                const existingUpload = s.find((x) => x.localId === fileId)
                if (existingUpload) {
                  existingUpload.state = "failed"
                }
              }),
            )
          }
        })
    }
  }

  const removeFile = (localId: string) => {
    setLocalImages((s) => s.filter((x) => x.localId !== localId))
    removeUploads([localId])
  }

  const orderedImages: ImageUpload[] = [
    ...localImages,
    ...remoteImages
      .filter(
        (i) =>
          !localImages
            .map((x) => x.localId)
            .filter(notUndefined)
            .includes(i.localId),
      )
      .map(
        (x) => ({ localId: x.localId, url: x.url, state: "success" } as const),
      ),
  ]

  const reset = () => {
    setLocalImages([])
    resetUploads()
  }

  return {
    addFiles,
    removeFile,
    files: orderedImages,
    reset,
    hasUnsavedImages: !!localImages.find((x) => x.state === "loading"),
  } as const
}

const ImageAnchor = styled.a`
  position: relative;
`

const ProgressBarContainer = styled.div`
  z-index: 10;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100px;
  display: flex;
  align-items: end;
  justify-content: center;
`

const StyledProgress = styled.progress`
  height: 0.2rem;
  border-radius: 0;
`

function ImageWithStatus({
  url,
  backgroundUrl,
  state,
  progress,
}: {
  url: string
  backgroundUrl: string | null
  state: ImageUpload["state"]
  progress?: number
}) {
  return (
    <>
      <ImageAnchor
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <ImagePreview
          isLoading={state === "loading"}
          src={url}
          backgroundUrl={backgroundUrl}
        />
        {progress != null &&
          // hide the progress bar once it is complete
          progress !== 100 && (
            <ProgressBarContainer>
              <StyledProgress
                value={progress}
                max="100"
                className="progress is-primary"
              />
            </ProgressBarContainer>
          )}
      </ImageAnchor>
      {state === "failed" && (
        <BrokenImageContainer title="Image upload failed">
          <BrokenImage>❌</BrokenImage>
        </BrokenImageContainer>
      )}
      {state === "loading" && (
        <LoaderContainer title="Image uploading...">
          <RotatingLoader />
        </LoaderContainer>
      )}
    </>
  )
}

type InProgressUpload = {
  readonly type: "in-progress"
  readonly url: string
  readonly file: File
  readonly localId: string
  readonly progress: number
  readonly state: ImageUpload["state"]
}

type UploadSuccess = Upload

type ImageUpload = {
  localId: string
  url: string
  progress?: number
  state: "loading" | "failed" | "success"
}

function ImageUploader({
  addFiles,
  removeFile,
  files,
}: {
  addFiles: (files: FileList) => void
  removeFile: (fileId: string) => void
  files: ImageUpload[]
}) {
  return (
    <>
      {files.length > 0 && (
        <ImageUploadContainer>
          {files.map((f) => (
            // NOTE(sbdchd): it's important that the `localId` is consistent
            // throughout the upload content, otherwise we'll wipe out the DOM
            // node and there will be a flash as the image changes.
            <ImagePreviewParent key={f.localId}>
              <ImageWithStatus
                progress={f.progress}
                url={f.url}
                state={f.state}
                backgroundUrl={null}
              />
              <CloseButton
                onClick={() => {
                  if (confirm("Delete image?")) {
                    removeFile(f.localId)
                  }
                }}
              >
                &times;
              </CloseButton>
            </ImagePreviewParent>
          ))}
        </ImageUploadContainer>
      )}
      <DragDropLabel className="text-muted mb-2">
        <input
          type="file"
          multiple
          accept="image/jpeg, image/png"
          style={{ display: "none" }}
          onChange={(e) => {
            const newFiles = e.target.files
            if (newFiles != null) {
              addFiles(newFiles)
              // we want to clear the file input so we can repeatedly upload the
              // same file.
              //
              // @ts-expect-error types don't allow this, but it works
              e.target.value = null
            }
          }}
        />
        Attach images by dragging & dropping, selecting or pasting them.
      </DragDropLabel>
    </>
  )
}

function UploadContainer({
  addFiles,
  children,
}: {
  children: React.ReactNode
  addFiles: (files: FileList) => void
}) {
  return (
    <NoteWrapper
      onDragOver={(event) => {
        event.dataTransfer.dropEffect = "copy"
      }}
      onDrop={(event) => {
        if (event.dataTransfer?.files) {
          const newFiles = event.dataTransfer.files
          addFiles(newFiles)
        }
      }}
    >
      {children}
    </NoteWrapper>
  )
}

function NoteCreator({ recipeId, className }: INoteCreatorProps) {
  const {
    isEditing,
    onEditorKeyDown,
    onEditorChange,
    editorMinRowCount,
    editorRowCount,
    editorText,
    onEditorFocus,
    onCreate,
    isLoading,
    onCancel,
    isDisabled,
    addUploads,
    removeUploads,
    uploadedImages,
    resetUploads,
  } = useNoteCreatorHandlers({
    recipeId,
  })

  const { addFiles, removeFile, files, hasUnsavedImages, reset } =
    useImageUpload(
      addUploads,
      removeUploads,
      uploadedImages,
      resetUploads,
      recipeId,
    )

  return (
    <div className={className}>
      <UploadContainer addFiles={addFiles}>
        <Textarea
          id="new_note_textarea"
          onKeyDown={onEditorKeyDown}
          minRows={editorMinRowCount}
          rows={editorRowCount}
          value={editorText}
          onFocus={onEditorFocus}
          onChange={onEditorChange}
          bottomFlat={isEditing}
          minimized={!isEditing}
          placeholder="Add a note..."
        />
        {isEditing && (
          <ImageUploader
            addFiles={addFiles}
            removeFile={removeFile}
            files={files}
          />
        )}
      </UploadContainer>

      {isEditing && (
        <div className="d-flex justify-end align-center">
          <Button
            size="small"
            className="mr-3"
            onClick={() => {
              onCancel()
              reset()
            }}
          >
            cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={onCreate}
            loading={isLoading}
            disabled={isDisabled || hasUnsavedImages}
          >
            add
          </Button>
        </div>
      )}
    </div>
  )
}

interface INoteContainerProps {
  readonly recipeId: IRecipe["id"]
  readonly timelineItems: IRecipe["timelineItems"]
  readonly openImage: (_: string) => void
}
export function NoteContainer(props: INoteContainerProps) {
  return (
    <>
      <hr />
      <NoteCreator recipeId={props.recipeId} className="pb-4 no-print" />
      {orderBy(props.timelineItems, "created", "desc").map((timelineItem) => {
        switch (timelineItem.type) {
          case "note": {
            return (
              <Note
                key={"recipe-note" + String(timelineItem.id)}
                note={timelineItem}
                openImage={props.openImage}
                recipeId={props.recipeId}
                className="pb-2"
              />
            )
          }
          case "recipe":
            return (
              <TimelineEvent
                key={"recipe-recipe" + String(timelineItem.id)}
                event={timelineItem}
                className="mb-4 py-4"
              />
            )
        }
      })}
    </>
  )
}
