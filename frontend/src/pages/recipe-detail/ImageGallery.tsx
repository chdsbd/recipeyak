import React from "react"
import { ChevronLeft, ChevronRight, Star, X } from "react-feather"

import { Button } from "@/components/Buttons"
import { styled } from "@/theme"

const MyGalleryContainer = styled.div`
  opacity: 1 !important;
  z-index: 30;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const MyGalleryImg = styled.img`
  max-height: 100%;
  max-width: 100%;
  margin: auto;
`

const MyGalleryImgContainer = styled.div`
  display: flex;
  height: 100%;
`

const MyGalleryScrollWrap = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const MyGalleryBackground = styled.div`
  opacity: 0.8;
  background: #000;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const ButtonSecondary = (props: React.ComponentProps<typeof Button>) => (
  <Button variant="secondary" {...props} />
)

const MyGalleryButton = styled(ButtonSecondary)`
  background: rgba(0, 0, 0, 0.46);
  color: white;
  border-style: none !important;
  box-shadow: none !important;
  backdrop-filter: blur(10px);
  pointer-events: initial;
`

const MyGalleryControlOverlay = styled.div`
  position: absolute;

  top: 0;
  height: 100%;
  width: 100%;
  display: grid;
  flex-direction: column;
  padding: 0.5rem;
  pointer-events: none;
`

const NavButtonRow = styled.div`
  display: flex;
  margin-top: auto;
  margin-bottom: auto;
  justify-content: space-between;

  width: 100%;
  grid-area: 1/1;
`

const TopRow = styled.div`
  display: flex;
  margin-bottom: auto;
  justify-content: space-between;

  width: 100%;
  grid-area: 1/1;
`

export const Gallery = (props: {
  onClose: () => void
  imageUrl: string
  readonly isPrimary: boolean
  onNext: () => void
  onPrevious: () => void
  onStar: () => void
  hasNext: boolean
  enableStarButton: boolean
  hasPrevious: boolean
}) => {
  // navigate forward and back depending on horizontal click position.
  const onClick = (e: React.MouseEvent) => {
    const isRight = e.screenX / window.screen.width > 0.5
    const isLeft = !isRight
    if (props.hasNext && isRight) {
      props.onNext()
    }
    if (props.hasPrevious && isLeft) {
      props.onPrevious()
    }
  }
  const starColor = props.isPrimary ? "#ffbf00" : undefined
  return (
    <MyGalleryContainer>
      <MyGalleryBackground />
      <MyGalleryScrollWrap>
        <MyGalleryImgContainer onClick={onClick}>
          <MyGalleryImg src={props.imageUrl} onClick={onClick} />
        </MyGalleryImgContainer>
        <MyGalleryControlOverlay>
          <TopRow>
            {props.enableStarButton && (
              <MyGalleryButton className="mr-auto" onClick={props.onStar}>
                <Star color={starColor} fill={starColor} />
              </MyGalleryButton>
            )}
            <MyGalleryButton className="ml-auto" onClick={props.onClose}>
              <X />
            </MyGalleryButton>
          </TopRow>
          <NavButtonRow>
            {props.hasPrevious && (
              <MyGalleryButton onClick={props.onPrevious} className="mr-auto">
                <ChevronLeft />
              </MyGalleryButton>
            )}
            {props.hasNext && (
              <MyGalleryButton onClick={props.onNext} className="ml-auto">
                <ChevronRight />
              </MyGalleryButton>
            )}
          </NavButtonRow>
        </MyGalleryControlOverlay>
      </MyGalleryScrollWrap>
    </MyGalleryContainer>
  )
}
