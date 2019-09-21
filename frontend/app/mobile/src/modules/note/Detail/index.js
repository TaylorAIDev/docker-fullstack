// Imports
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, ScrollView, RefreshControl } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import moment from 'moment'

// UI Imports
import Typography from '../../../ui/Typography'
import { grey5 } from '../../../ui/common/colors'
import styles from './styles'

// App Imports
import params from '../../../setup/config/params'
import { routesNote } from '../../../setup/routes/postLogin/note'
import translate from '../../../setup/translate'
import { messageShow } from '../../common/api/actions'
import { NOTE_DETAIL_CACHE } from '../api/actions/cache-keys'
import { list, detail } from '../api/actions/query'
import { remove } from '../api/actions/mutation'
import NavigationTopInner from '../../common/NavigationTopInner'
import ActionBack from '../../common/NavigationTop/ActionBack'
import Button from '../../../ui/button/Button'
import Body from '../../common/Body'

// Component
class Detail extends PureComponent {

  state = {
    isLoading: false,
    detail: null,
    
    isDeleting: false
  }

  async componentDidMount() {
    await this.#refresh()
  }

  #refresh = async (isLoading = true) => {
    const { navigation, dispatch } = this.props

    const noteId = navigation.getParam('noteId')

    if(noteId) {
      const CACHE_KEY = NOTE_DETAIL_CACHE + noteId

      const note = JSON.parse(await AsyncStorage.getItem(CACHE_KEY))

      if(note) {
        this.setState({
          detail: note
        })
      } else {
        this.#isLoadingToggle(isLoading)
      }

      try {
        const { data } = await dispatch(detail({ noteId }))

        if(data.success) {
          const note = data.data

          this.setState({
            detail: note
          })

          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(note))
        }
      } catch(error) {
        dispatch(messageShow({ success: false, message: translate.t('common.error.default') }))
      } finally {
        this.#isLoadingToggle(false)
      }
    } else {
      navigation.navigate(routesNote.list.name)
    }
  }

  #isLoadingToggle = isLoading => {
    this.setState({
      isLoading
    })
  }

  #isDeletingToggle = isDeleting => {
    this.setState({
      isDeleting
    })
  }

  #onDelete = async () => {
    const { navigation, dispatch } = this.props
    const { detail: { _id } } = this.state

    this.#isDeletingToggle(true)

    try {
      const { data } = await dispatch(remove({ noteId: _id }))

      this.#isDeletingToggle(false)

      dispatch(messageShow({ success: data.success, message: data.message }))

      if(data.success) {
        dispatch(list(false))

        navigation.navigate(routesNote.list.name)
      }
    } catch(error) {
      this.#isDeletingToggle(false)

      dispatch(messageShow({ success: false, message: translate.t('common.error.default') }))
    }
  }

  render() {
    const { isLoading, detail, isDeleting } = this.state

    return (
      <Body>
        <View style={styles.container}>
          {/* Navigation */}
          <NavigationTopInner
            title={translate.t('note.detail.title')}
            subTitle={translate.t('note.detail.subTitle', { date: detail && detail._id ? moment(detail.createdAt).format(params.common.formats.dateTime) : '' })}
            leftIcon={
              <ActionBack />
            }
            rightContent={
              <Button
                title={translate.t('common.button.delete')}
                theme={'outlined'}
                onPress={this.#onDelete}
                disabled={isDeleting}
                shadow={false}
                condensed
              />
            }
          />

          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={this.#refresh}
                tintColor={grey5}
              />
            }
            style={styles.container}
          >
            <View style={styles.content}>
              {
                detail && detail._id &&
                <Typography size={'h4'}>{ detail.note }</Typography>
              }
            </View>
          </ScrollView>
        </View>
      </Body>
    )
  }
}

export default connect()(Detail)
