# README

## Waffle

https://waffle.io/conradlempert/openhpigame

# Frontend

## Rooms

All the levels and learning items can be opened from rooms. As the player walks through the levels of the game, he will unlock new rooms with new items. In the current version there are 4 rooms: `room1`, `room2`, `room3` and `room4`. To show `room1`, just call `room1.show()`.

### Constructor

`new Room(name, background, nr)`

Parameter | Description
--- | --- 
`name` | Unique name for the room, which becomes the name of the cached background sprite
`background` | Path to the background image for the room
`nr` | Progress level of this room (`room1.nr` is 1, `room2.nr` is 2. This means when you already made it to `room2`, you can go back to `room1`, but not vice versa.)

### Attributes

Attribute | Description
--- | ---
`items` | Array with all the items in this room
`activeLevel` | The currently displayed level in this room (`null` without level)
`inDialogue` | Dialogue which is shown when the room opens
`outDialogue` | Dialogue which is shown when the room closes
`endLevels` | Array of levels, which have to be completed to exit this room
`currentEndLevel` | Current index in the `endLevels` Array
`nextRoom` | The room which is shown when all `endLevels` are finished

### State

Each room has a Phaser.IO `state`. This means, that every room has its own `preload()`, `create()`, and `update()` method.

Method | Description
--- | ---
`state.preload()` | Loads the background sprite for this room
`state.create()` | Renders the room, shows the intro dialogue and resets the progress for this room
`state.update()` | Updates the `activeLevel`

### Methods

Method | Description
--- | ---
`showLevel(level)` | Shows the `level`
`endLevel()` | Shows the next level, that is required to exit this room
`closeLevel()` | Closes the `activeLevel`
`render()` | Renders the `background` and all the `items` in this room
`show()` | Activates the `state` (calls `state.create()`)

## Levels

A `Level` is a circuit plan with `inputs`, `gates` and `outputs`. There are three types of levels:

Type | Description
--- | ---
`'challenge'` | You must guess the right input combination that is required to get the desired output values
`'choice'` | You must guess the right circuit that is equivalent to a given boolean expression
`'lernItem'` | You can just play around with this level to learn something

To show `level1_1` from `room1`, just call `room1.showLevel(level1_1)`.

### Constructor

`new Level(name, type, expression, winAction)`

Parameter | Description
--- | --- 
`name` | Unique name for the level
`type` (optional) | Level type (see table above), is `'challenge'` by default
`expression` (optional) | Boolean expression that equals the level
`winAction` (optional) | Callback function that is called when the level is completed successfully

### Attributes

Attribute | Description
--- | ---
`inputs` | All the inputs in this level
`gates` | All the gates in this level
`outputs` | All the outputs in this level
`completed` | Boolean which indicates if the level is completed successfully
`window` | Object which describes the window in which the level is shown. For example `{ x: 50, y: 50, width: 100, height: 100}`. If not set, the level is shown in fullscreen.
`backgroundImage` | The name of the sprite which is the background for the level. By default it is `'defaultBg'`, which is a sky full of stars right now
`destroyableGraphics` | All the sprites which have to be destroyed when the level is closed
`dialogue` | Dialogue which is shown when the level is shown

### Methods

Method | Description
--- | ---
`show(room)` | Shows this level in the given `room`. Draws all the `inputs`, `gates` and `outputs` and the other UI
`addInput(name, x, y, on, locked)` | Creates an `Input` with these parameters. See the `Input` documentation for more detail
`addGate(type, x, y)` | Creates a `Gate` with these parameters. See the `Gate` documentation for more detail
`addOutput(expected, x, y, name)` | Creates an `Output` with these parameters. See the `Output` documentation for more detail
`update()` | Redraws all the connections and outputs
`checkWin()` | (`'challenge'` type only) Checks if the inputs are set correctly, executes `win()` if they are, and `fail()` if they're not
`checkChoice(index)` | (`'choice'` type only) Checks if the circuit at `index` is the correct one, executes `win()` if it is, and `fail()`if it isn't
`drawConnection(startX, startY, goalX, goalY, on)` | Draws a circuit connection between the start and the goal
`win()` | This is called when you checked a right solution. Executes the `winAction`
`fail()` | This is called when you checked a wrong solution. Takes you back to the room
`registerToDestroy(element)` | When you call this with `element`, it is destroyed when the level is destroyed
`destroy()` | Destroys the level and all the `destroyableGraphics`



# Backend

## Services
The Backend is dockerized. The services are:

1. Web: Rails Server for handling LTI and rendering the frontend
2. Postgres: Database for persistence (not used at the moment)
3. Nginx: Reverse Proxy

To add or remove services you will need to edit the `docker-compose.yml`

## Starting the server via Docker

1. Rename file `.env.sample` to `.env`
2. Modify the values in `.env` **(for production)**
3. Run `$ docker-compose up`


## LTI (1.1)

The app can act as a LTI Tool Provider through the `'/lti'` endpoint.
To start the quiz one must `post` to this endpoint according to the **LTI 1.1** specification.

 
LTI Secrets and Keys can be configured in `config/initializers/lti.rb`

The app is preconfigured for the key `openhpi` the corresponding secret 
must be specified in the `.env` file

### Important LTI Parameters

```
lis_outcome_service_url // For updating the score
launch_presentation_return_url // Url to return to after game was completed
launch_presentation_locale // For setting the quiz locale ('de', 'en')
```
### Implementation

LTI connectivity is handled through the LTI Controller in `app/controllers/lti_controller.rb`

We expose three lti endpoints defined in `config/routes.rb`.

#### post '/lti'

The first endpoint is the entrypoint `'/lti'`, this is mapped to the `create` action of the LTI Controller. Here we save the recievied LTI parameters in the session and try to determine the correct locale.

```
  def create
    session[:lti_launch_params] = lti_params
    session[:locale] = lti_params.fetch('launch_presentation_locale', I18n.default_locale)
    redirect_to '/'
  end
```

#### post '/update_score'


The next endpoint handles the updating of the quiz score.
It is exposed as `'/update_score'` and maps to the `update_score`
action of the LTI Controller. This action is used by posting a score value to the endpoint. The Controller than first requests the current score of the user from the external outcome service and
compares it to the score that was posted. If the posted score is higher than the old score it is send back to the outcome service to be updated.

```
  def update_score
    unless tool_provider.nil?
      old_score = get_current_score
      score = params.permit(:score)[:score]
      if score > old_score
        response = tool_provider.post_replace_result!(score)
        if response.success? || response.processing?
          return render json: { score: score }
        else
          Rails.logger.warn('Outcome could not be posted. Response was: ')
          Rails.logger.warn(response.to_json)
          return render json: {errors: ['Error while transmitting score']}, status: 500
        end
      end
      render json: { score: old_score }
    end
  end
```

#### get '/quiz_finished'

This endpoint allows us to return to the tool provider once the quiz has finished. Here we simply redirect to the `launch_presentation_return_url` if it was passed to the `/lti` endpoint and saved to the session.

```
def return
  if @consumer_url.present?
    redirect_to @consumer_url
  end
end
  
def consumer_url
    @consumer_url ||= session.to_hash.dig('lti_launch_params', 'launch_presentation_return_url')
end
```


#### Tool Provider Object

The actual lti communication is handled trough the gems `ims-lti 1.1.3` and `omniauth-lti`. The gem `omniauth-lti` was added to the repository because changes were necessary to make it work with rails 5. If preferred you can extract it again.

The lti communication is handled through the `tool_provider` object, 
which is implemented by the `ims-lti` gem and initialized in the LTI Controller method `tool_provider`

Here we first check if lti params were saved to the session trough
`lti_launch_params`, which are defined by the `omniauth-lti` gem.
This is the same as calling `session[:lti_launch_params]` directly.
Then we extract the key and secret from the parameters and the configured credentials (`LTI_CREDENTIALS_HASH` in `config/initializers/lti.rb`).

Finally we create the tool_provider object and pass it the key, secret and the rest of the parameters.

This allows it to create a validated connection to the external tool consumer service.

```
  def tool_provider
    unless lti_launch_params.nil?
      key = lti_launch_params['oauth_consumer_key']
      secret = LTI_CREDENTIALS_HASH[key.to_sym]
      tool_provider = IMS::LTI::ToolProvider.new(key,
                                                 secret,
                                                 lti_launch_params)
    end
  end
```
We use the following two methods of this object.

```
// Post the passed score to the external tool consumer
tool_provider.post_replace_result!(score)

// Reads the current score from the external tool consumer
tool_provider.post_read_result!```

