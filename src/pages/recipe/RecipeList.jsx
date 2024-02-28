import {
  Flex,
  Title,
  Anchor,
  Image,
  Box,
  Text,
  Card,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import useEdamam from "../../hooks/useEdamam";
import LoaderDots from "../../components/parts/Loader.jsx";
import CarouselCards from "../../components/parts/CarouselCards.jsx";
import { useMediaQuery } from "@mantine/hooks";
import classes from "./RecipeList.module.css";
import { IconSchool, IconToolsKitchen3 } from "@tabler/icons-react";

export default function RecipeList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { sendRequest } = useFetch();
  const {
    sendEdamamRequest,
    derivedLevelofDiff,
    formattedCategories,
    edamamRecpUri,
  } = useEdamam();
  const theme = useMantineTheme();
  const isPc = useMediaQuery(`(min-width: ${theme.breakpoints.xs})`);

  useEffect(() => {
    const fetchData = async () => {
      /* need to set this up as async so the concatenation of both int and ext list would only
      start when both fetch processes are fulfilled, else we may run into the possibility of
      getting undefined because either/both processes are not completed in time for
      recipeCollection to run */
      try {
        const intData = await getInternalList();
        const extData = await getEdamamList();
        console.log(extData);
        //recall that we had set both output as array of objects to facilitate the use of map

        const recipeCollection = [...intData, ...extData];
        setData(recipeCollection);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    };
    fetchData();
  }, []);

  const getInternalList = async () => {
    try {
      const recpData = await sendRequest(
        `${import.meta.env.VITE_API_URL}/recipe`,
        "GET"
      );
      // recpData returns as an object. need to get array to use map function below
      return recpData.recipes;
    } catch (err) {
      console.error("Error fetching internal recipe data:", err);
    }
  };

  const getEdamamList = async () => {
    try {
      const edamamRecp = await sendEdamamRequest(
        "https://api.edamam.com/api/recipes/v2?type=public&app_id=06f16e1e&app_key=c06c81514c5f0c114da3fa25ac9cc76a&dishType=Biscuits%20and%20cookies&dishType=Bread&random=true&field=label&field=image&field=source&field=url&field=yield&field=healthLabels&field=ingredientLines&field=ingredients&field=calories&field=totalTime&field=dishType&field=externalId"
      );

      const mappedEdamamRecp = edamamRecp.hits.map((hit) => {
        let recipe = hit.recipe;
        return {
          _id: `edam/${edamamRecpUri(hit._links.self.href)}`,
          name: recipe.label,
          category: formattedCategories(recipe.dishType[0]),
          levelOfDiff: derivedLevelofDiff(recipe.ingredientLines),
          timeRequired: recipe.totalTime,
          servings: recipe.yield,
          ingredients: recipe.ingredients.map((ingredient) => {
            return {
              quantity: ingredient.quantity,
              unit: ingredient.measure,
              name: ingredient.food,
              key: ingredient.foodId,
            };
          }),
          instructions: recipe.url,
          description: `This recipe from ${recipe.source} is associated with ${recipe.healthLabels[0]}, ${recipe.healthLabels[1]} and ${recipe.healthLabels[2]} diets, amongst others. It packs a total of ${recipe.calories} for the specified serving. Give it a try if it appeals to you today!`,
          source: recipe.source,
          createdAt: new Date().toISOString(), // You can set this to the current date and time
          updatedAt: new Date().toISOString(), // You can set this to the current date and time
          __v: 0, // Assuming this is a version field
          image: null,
        };
      });
      return mappedEdamamRecp;
    } catch (err) {
      console.error("Error fetching internal recipe data:", err);
    }
  };

  return (
    <>
      {loading ? (
        <LoaderDots />
      ) : (
        <>
          <CarouselCards />
          <Title order={3} mt="sm" lineClamp={2}>
            TRENDING NOW
          </Title>
          <Flex
            gap="xs"
            justify="flex-start"
            align="center"
            wrap="wrap"
            mt="sm"
            h="100px"
          >
            {data.map((recipe) => (
              <Anchor
                key={recipe._id}
                component={Link}
                to={`/recipe/${recipe._id}`}
                underline="none"
                display="block"
                w={
                  isPc ? `calc(20% - var(--mantine-spacing-xs) * 4 / 5` : `100%`
                }
              >
                <Flex direction="column" w="100%">
                  <Card shadow="sm" padding="xs" radius="md" withBorder>
                    <Card.Section>
                      <Image
                        src={recipe.image}
                        alt={recipe.name}
                        // className={classes.image}
                        height={100}
                      />
                    </Card.Section>

                    <Stack
                      h={100}
                      bg="var(--mantine-color-body)"
                      align="flex-start"
                      gap="xs"
                    >
                      <Text size="md" fw={600}>
                        {recipe.name}
                      </Text>
                      <Box w="20%">
                        <Flex align="center" gap="xs" mt="xs">
                          <Flex align="center" gap="5px">
                            <IconToolsKitchen3 w="sm" h="sm" stroke={1.5} />
                            <Text size="sm" c="black" lh="1">
                              {recipe.category}
                            </Text>
                            <IconSchool w="sm" h="sm" stroke={1.5} />
                            <Text size="sm" c="black" lh="1">
                              {recipe.levelOfDiff}
                            </Text>
                          </Flex>
                        </Flex>
                      </Box>
                    </Stack>
                  </Card>
                </Flex>
              </Anchor>
            ))}
          </Flex>
        </>
      )}
    </>
  );
}
